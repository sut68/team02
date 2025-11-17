import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/app/lib/prisma';
import { validatePassword, validateEmail, sanitizeInput } from '@/app/lib/validation';
import { registerLimiter } from '@/app/lib/rate-limit';

export async function POST(request: NextRequest) {
  // ตรวจสอบ rate limit
  const rateLimitResult = await registerLimiter(request);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  try {
    const body = await request.json();
    const {
      email,
      password,
      fullName,
      phone,
      address,
      subdistrict,
      district,
      province,
      postalCode,
      studentCode,
      major,
      gradYear,
      userType,
    } = body;

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
          gradYear: gradYear ? parseInt(gradYear) : null,
          status: studyStatus,
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
