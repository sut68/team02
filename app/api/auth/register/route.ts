import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/app/lib/prisma';
import { validatePassword, validateEmail, sanitizeInput } from '@/app/lib/validation';
import { registerLimiter } from '@/app/lib/rate-limit';
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
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน' },
        { status: 400 }
      );
    }

    // Validate education fields
    if (!studentCode || !major) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลการศึกษาให้ครบถ้วน' },
        { status: 400 }
      );
    }

    // Validate gradYear for alumni
    if (userType === 'alumni' && !gradYear) {
      return NextResponse.json(
        { error: 'กรุณาระบุปีที่จบการศึกษา' },
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

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.error },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedFullName = sanitizeInput(fullName);
    const sanitizedEmail = email.toLowerCase().trim();
    const sanitizedStudentCode = sanitizeInput(studentCode);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: sanitizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'อีเมลนี้ถูกใช้งานแล้ว' },
        { status: 400 }
      );
    }

    // Check if student code already exists
    const existingStudentCode = await prisma.educationRecord.findUnique({
      where: { studentCode: sanitizedStudentCode },
    });

    if (existingStudentCode) {
      return NextResponse.json(
        { error: 'รหัสนักศึกษานี้ถูกใช้งานแล้ว' },
        { status: 400 }
      );
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
        const arrayBuffer = await transcriptFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const uploadDir = resolveUploadDir();
        await fs.mkdir(uploadDir, { recursive: true });
        const allowedMime = ['application/pdf', 'image/png', 'image/jpeg'];
        if (transcriptFile.type && !allowedMime.includes(transcriptFile.type)) {
          return NextResponse.json({ error: 'ชนิดไฟล์ไม่รองรับ (รองรับ: PDF, PNG, JPG)' }, { status: 400 });
        }
        const ext = pickExtension(transcriptFile);
        const uniqueName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
        const fullPath = path.join(uploadDir, uniqueName);
        await fs.writeFile(fullPath, buffer);
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
        return NextResponse.json(
          { error: 'ไม่สามารถบันทึกไฟล์เอกสารได้' },
          { status: 500 }
        );
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
          phone: sanitizeInput(phone),
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
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลงทะเบียน' },
      { status: 500 }
    );
  }
}
