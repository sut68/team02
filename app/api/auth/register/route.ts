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
    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน' },
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

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: sanitizedEmail,
        password: hashedPassword,
        fullName: sanitizedFullName,
        phone: sanitizeInput(phone || ''),
        address: address || '',
        subdistrict: subdistrict || '',
        district: district || '',
        province: province || '',
        postalCode: postalCode || '',
        studentCode: studentCode || null,
        major: major || null,
        gradYear: gradYear || null,
        userType: userType || 'student',
        status: 'pending', // รอการอนุมัติจาก admin
      },
    });

    return NextResponse.json(
      {
        message: 'ลงทะเบียนสำเร็จ กรุณารอการอนุมัติจากแอดมิน',
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          status: user.status,
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
