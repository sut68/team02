import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@/app/lib/prisma';
import { loginLimiter } from '@/app/lib/rate-limit';
import { validateEmail } from '@/app/lib/validation';
import { checkBruteForce, recordFailedAttempt, clearFailedAttempts, logSecurityEvent, createSafeErrorResponse } from '@/app/lib/security';

const JWT_SECRET =
  process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// Ensure Node.js runtime for database operations
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  
  try {
    // ตรวจสอบ rate limit
    const rateLimitResult = await loginLimiter(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }
  } catch (rateLimitError) {
    console.error('Rate limit error:', rateLimitError);
    return createSafeErrorResponse(500, 'เกิดข้อผิดพลาดในการตรวจสอบ rate limit');
  }

  try {
    // Parse JSON body with error handling
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      logSecurityEvent('LOGIN_INVALID_JSON', 'Invalid JSON in login request', ip);
      return createSafeErrorResponse(400, 'รูปแบบข้อมูลไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
    }

    const { email, password } = body;

    // Validation
    if (!email || !password) {
      logSecurityEvent('LOGIN_MISSING_CREDENTIALS', 'Missing email or password', ip);
      return createSafeErrorResponse(400, 'กรุณากรอกอีเมลและรหัสผ่าน');
    }

    // Validate email format
    if (!validateEmail(email)) {
      logSecurityEvent('LOGIN_INVALID_EMAIL', `Invalid email format: ${email}`, ip);
      return createSafeErrorResponse(400, 'รูปแบบอีเมลไม่ถูกต้อง');
    }

    // Check brute force protection
    const bruteForceCheck = checkBruteForce(email);
    if (!bruteForceCheck.allowed) {
      logSecurityEvent('LOGIN_BRUTE_FORCE', `Account locked: ${email}`, ip);
      return createSafeErrorResponse(429, 'บัญชีของคุณถูกล็อกชั่วคราว กรุณาลองอีกครั้งในอีก 15 นาที');
    }

    // Find user with relations
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
        include: {
          verification: true,
          educationRecords: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      logSecurityEvent('LOGIN_DB_ERROR', `Database error for ${email}`, ip);
      return createSafeErrorResponse(500, 'เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล');
    }

    if (!user) {
      recordFailedAttempt(email);
      logSecurityEvent('LOGIN_USER_NOT_FOUND', `User not found: ${email}`, ip);
      return createSafeErrorResponse(401, 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      recordFailedAttempt(email);
      logSecurityEvent('LOGIN_INVALID_PASSWORD', `Invalid password for ${email}`, ip);
      return createSafeErrorResponse(401, 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }

    // Check verification status (skip for ADMIN)
    if (user.role !== 'ADMIN') {
      if (!user.verification || user.verification.status !== 'APPROVED') {
        const verificationStatus = user.verification?.status || 'PENDING';
        logSecurityEvent('LOGIN_UNVERIFIED', `Unverified login attempt: ${email} (${verificationStatus})`, ip);
        return createSafeErrorResponse(
          403,
          verificationStatus === 'PENDING'
            ? 'บัญชีของคุณรอการอนุมัติจากแอดมิน'
            : 'บัญชีของคุณถูกปฏิเสธ กรุณาติดต่อผู้ดูแลระบบ'
        );
      }
    }

    // Clear failed attempts after successful password check
    clearFailedAttempts(email);

    // Generate JWT token with shorter expiration
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '24h' } // Changed from 7d to 24h for better security
    );

    // Log successful login
    logSecurityEvent('LOGIN_SUCCESS', `Successful login for ${email}`, ip, user.id.toString());

    // Create response with token
    const response = NextResponse.json(
      {
        message: 'เข้าสู่ระบบสำเร็จ',
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
      },
      { status: 200 }
    );

    // Set HTTP-only cookie with enhanced security
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Only HTTPS in production
      sameSite: 'strict', // Changed from 'lax' to 'strict' for CSRF protection
      maxAge: 60 * 60 * 24, // 24 hours (matches JWT expiration)
      path: '/',
    });

    return response;
  } catch (error: unknown) {
    console.error('Login error:', error);
    logSecurityEvent('LOGIN_EXCEPTION', `Unexpected error during login`, ip);

    // Ensure we always return JSON, never HTML
    // This prevents the "Unexpected token '<'" error
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
    }

    return createSafeErrorResponse(
      500,
      'เกิดข้อผิดพลาดในการเข้าสู่ระบบ',
      process.env.NODE_ENV === 'development' ? errorMessage : undefined
    );
  }
}
