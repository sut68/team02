import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@/app/lib/prisma';
import { loginLimiter } from '@/app/lib/rate-limit';
import { validateEmail } from '@/app/lib/validation';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

export async function POST(request: NextRequest) {
  // ตรวจสอบ rate limit
  const rateLimitResult = await loginLimiter(request);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  try {
    const { email, password } = await request.json();

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'กรุณากรอกอีเมลและรหัสผ่าน' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'รูปแบบอีเมลไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    // Find user with relations
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        verification: true,
        educationRecords: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      );
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      );
    }

    // Check verification status (skip for ADMIN)
    if (user.role !== 'ADMIN') {
      if (!user.verification || user.verification.status !== 'APPROVED') {
        const verificationStatus = user.verification?.status || 'PENDING';
        return NextResponse.json(
          {
            error: verificationStatus === 'PENDING'
              ? 'บัญชีของคุณรอการอนุมัติจากแอดมิน'
              : 'บัญชีของคุณถูกปฏิเสธ กรุณาติดต่อผู้ดูแลระบบ',
          },
          { status: 403 }
        );
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

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

    // Set HTTP-only cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' },
      { status: 500 }
    );
  }
}
