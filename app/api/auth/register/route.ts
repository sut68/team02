import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/app/lib/prisma';
import { validatePassword, validateEmail, sanitizeInput, validatePhoneNumber } from '@/app/lib/security';
import { registerLimiter } from '@/app/lib/rate-limit';
import { validateFileUpload, logSecurityEvent, createSafeErrorResponse } from '@/app/lib/security';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// Resolve upload directory with env fallback (must stay inside public for static serving)
function resolveUploadDir(): string {
  const envDir = process.env.UPLOAD_DIR?.trim();
  if (envDir) {
    // If absolute path and inside project public, use directly; else join to public
    if (path.isAbsolute(envDir)) {
      return envDir;
    }
    return path.join(process.cwd(), envDir);
  }
  return path.join(process.cwd(), 'public', 'uploads', 'transcripts');
}

function pickExtension(file: File): string {
  const nameExt = path.extname(file.name).toLowerCase();
  if (nameExt) return nameExt;
  const type = file.type.toLowerCase();
  if (type === 'application/pdf') return '.pdf';
  if (type === 'image/png') return '.png';
  if (type === 'image/jpeg') return '.jpg';
  return '.dat';
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  
  // ตรวจสอบ rate limit
  const rateLimitResult = await registerLimiter(request);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  try {
    // Use multipart/form-data to support transcript file upload
    const formData = await request.formData();
    const email = (formData.get('email') as string | null) || '';
    const password = (formData.get('password') as string | null) || '';
    const fullName = (formData.get('fullName') as string | null) || '';
    const phone = (formData.get('phone') as string | null) || '';
    const address = (formData.get('address') as string | null) || '';
    const subdistrict = (formData.get('subdistrict') as string | null) || '';
    const district = (formData.get('district') as string | null) || '';
    const province = (formData.get('province') as string | null) || '';
    const postalCode = (formData.get('postalCode') as string | null) || '';
    const studentCode = (formData.get('studentCode') as string | null) || '';
    const major = (formData.get('major') as string | null) || '';
    const gradYear = (formData.get('gradYear') as string | null) || '';
    const userType = (formData.get('userType') as string | null) || 'student';
    const transcriptFile = formData.get('transcript') as File | null;

    // Validation - Basic fields
    if (!email || !password || !fullName || !phone || !address || !subdistrict || !district || !province || !postalCode) {
      logSecurityEvent('REGISTER_MISSING_FIELDS', 'Missing required registration fields', ip);
      return createSafeErrorResponse(400, 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
    }

    // Validate education fields
    if (!studentCode || !major) {
      logSecurityEvent('REGISTER_MISSING_EDUCATION', 'Missing education fields', ip);
      return createSafeErrorResponse(400, 'กรุณากรอกข้อมูลการศึกษาให้ครบถ้วน');
    }

    // Validate gradYear for alumni
    if (userType === 'alumni' && !gradYear) {
      logSecurityEvent('REGISTER_MISSING_GRADYEAR', 'Alumni missing grad year', ip);
      return createSafeErrorResponse(400, 'กรุณาระบุปีที่จบการศึกษา');
    }

    // Validate email format
    if (!validateEmail(email)) {
      logSecurityEvent('REGISTER_INVALID_EMAIL', `Invalid email format: ${email}`, ip);
      return createSafeErrorResponse(400, 'รูปแบบอีเมลไม่ถูกต้อง');
    }

    // Validate phone number
    if (!validatePhoneNumber(phone)) {
      logSecurityEvent('REGISTER_INVALID_PHONE', `Invalid phone format: ${phone}`, ip);
      return createSafeErrorResponse(400, 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง (ต้องเป็น 10 หลัก)');
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      logSecurityEvent('REGISTER_WEAK_PASSWORD', `Weak password attempt for ${email}`, ip);
      return createSafeErrorResponse(400, passwordValidation.error || 'รหัสผ่านไม่เข้มแข็งพอ');
    }

    // Sanitize inputs
    const sanitizedFullName = sanitizeInput(fullName);
    const sanitizedEmail = email.toLowerCase().trim();
    const sanitizedStudentCode = sanitizeInput(studentCode);
    const sanitizedPhone = phone.replace(/[\s-]/g, '');

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: sanitizedEmail },
    });

    if (existingUser) {
      logSecurityEvent('REGISTER_EMAIL_EXISTS', `Duplicate email registration: ${sanitizedEmail}`, ip);
      return createSafeErrorResponse(400, 'อีเมลนี้ถูกใช้งานแล้ว');
    }

    // Check if student code already exists
    const existingStudentCode = await prisma.educationRecord.findUnique({
      where: { studentCode: sanitizedStudentCode },
    });

    if (existingStudentCode) {
      logSecurityEvent('REGISTER_STUDENTCODE_EXISTS', `Duplicate student code: ${sanitizedStudentCode}`, ip);
      return createSafeErrorResponse(400, 'รหัสนักศึกษานี้ถูกใช้งานแล้ว');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Determine role and study status
    const role = userType === 'alumni' ? 'ALUMNI' : 'STUDENT';
    const studyStatus = userType === 'alumni' ? 'GRADUATED' : 'ACTIVE';

    // Prepare transcript storage if provided
    let storedTranscriptPath: string | null = null;
    if (transcriptFile && transcriptFile.size > 0) {
      try {
        // Validate file upload
        const fileValidation = validateFileUpload(transcriptFile.name, transcriptFile.size);
        if (!fileValidation.valid) {
          logSecurityEvent('REGISTER_INVALID_FILE', `Invalid transcript file: ${fileValidation.error}`, ip);
          return createSafeErrorResponse(400, fileValidation.error || 'ไฟล์ไม่ถูกต้อง');
        }

        const arrayBuffer = await transcriptFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const uploadDir = resolveUploadDir();
        await fs.mkdir(uploadDir, { recursive: true });
        
        const ext = pickExtension(transcriptFile);
        const uniqueName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
        const fullPath = path.join(uploadDir, uniqueName);
        // Ensure public path prefix: if uploadDir is under public, compute relative
        const publicDir = path.join(process.cwd(), 'public');
        if (uploadDir.startsWith(publicDir)) {
          storedTranscriptPath = `/${path.relative(publicDir, path.join(uploadDir, uniqueName)).replace(/\\/g,'/')}`;
        } else {
          // Not under public; can't serve directly
          storedTranscriptPath = null;
        }
      } catch (e) {
        console.error('Transcript upload failed:', e);
        logSecurityEvent('REGISTER_FILE_SAVE_ERROR', `Failed to save transcript for ${sanitizedEmail}`, ip);
        return createSafeErrorResponse(500, 'ไม่สามารถบันทึกไฟล์เอกสารได้');
      }
    }

    // Create user with education record and verification in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: sanitizedEmail,
          password: hashedPassword,
          fullName: sanitizedFullName,
          phone: sanitizedPhone,
          address: sanitizeInput(address),
          subdistrict: sanitizeInput(subdistrict),
          district: sanitizeInput(district),
          province: sanitizeInput(province),
          postalCode: sanitizeInput(postalCode),
          role: role,
        },
      });

      // Create education record
      await tx.educationRecord.create({
        data: {
          userId: user.id,
          studentCode: sanitizedStudentCode,
          major: sanitizeInput(major),
          gradYear: gradYear ? parseInt(gradYear) : undefined,
          status: studyStatus,
          transcript: storedTranscriptPath || undefined,
        },
      });

      // Create verification record (pending by default)
      await tx.verification.create({
        data: {
          userId: user.id,
          status: 'PENDING',
        },
      });

      return user;
    });

    logSecurityEvent('REGISTER_SUCCESS', `New registration for ${sanitizedEmail}`, ip, result.id.toString());

    return NextResponse.json(
      {
        message: 'ลงทะเบียนสำเร็จ กรุณารอการอนุมัติจากแอดมิน',
        user: {
          id: result.id,
          email: result.email,
          fullName: result.fullName,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Register error:', error);
    logSecurityEvent('REGISTER_EXCEPTION', 'Unexpected error during registration', ip);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (error instanceof Error && process.env.NODE_ENV === 'development') {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
    }

    return createSafeErrorResponse(
      500,
      'เกิดข้อผิดพลาดในการลงทะเบียน',
      process.env.NODE_ENV === 'development' ? errorMessage : undefined
    );
  }
}
