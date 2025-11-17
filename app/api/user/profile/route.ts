import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import bcrypt from 'bcryptjs';

// GET - ดึงข้อมูล profile ของผู้ใช้
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลผู้ใช้' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: {
        id: true,
        fullName: true,
        email: true,
        address: true,
        subdistrict: true,
        district: true,
        province: true,
        postalCode: true,
        phone: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลผู้ใช้' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    );
  }
}

// PUT - อัปเดตข้อมูล profile
export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลผู้ใช้' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      fullName,
      email,
      address,
      subdistrict,
      district,
      province,
      postalCode,
      phone,
      password,
    } = body;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!fullName || !email || !address || !subdistrict || !district || !province || !postalCode || !phone) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      );
    }

    // ตรวจสอบ email ซ้ำ (ยกเว้นของตัวเอง)
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        NOT: { id: parseInt(userId) },
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'อีเมลนี้ถูกใช้งานแล้ว' },
        { status: 400 }
      );
    }

    // เตรียมข้อมูลสำหรับอัปเดต
    const updateData: any = {
      fullName,
      email,
      address,
      subdistrict,
      district,
      province,
      postalCode,
      phone,
    };

    // ถ้ามีการเปลี่ยนรหัสผ่าน
    if (password && password.trim() !== '') {
      if (password.length < 8) {
        return NextResponse.json(
          { error: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' },
          { status: 400 }
        );
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    // อัปเดตข้อมูล
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: updateData,
      select: {
        id: true,
        fullName: true,
        email: true,
        address: true,
        subdistrict: true,
        district: true,
        province: true,
        postalCode: true,
        phone: true,
      },
    });

    return NextResponse.json({
      message: 'อัปเดตข้อมูลสำเร็จ',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล' },
      { status: 500 }
    );
  }
}
