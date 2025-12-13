import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      );
    }

    // ตรวจสอบความยาวรหัสผ่าน
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' },
        { status: 400 }
      );
    }

    // ค้นหา token
    const resetRecord = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetRecord) {
      return NextResponse.json(
        { error: 'ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่า token ถูกใช้ไปแล้วหรือไม่
    if (resetRecord.used) {
      return NextResponse.json(
        { error: 'ลิงก์รีเซ็ตรหัสผ่านนี้ถูกใช้ไปแล้ว' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่า token หมดอายุหรือไม่
    if (new Date() > resetRecord.expiresAt) {
      return NextResponse.json(
        { error: 'ลิงก์รีเซ็ตรหัสผ่านหมดอายุแล้ว กรุณาขอลิงก์ใหม่' },
        { status: 400 }
      );
    }

    // Hash รหัสผ่านใหม่
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // อัพเดทรหัสผ่าน
    await prisma.user.update({
      where: { id: resetRecord.userId },
      data: { password: hashedPassword },
    });

    // ทำเครื่องหมายว่า token ถูกใช้แล้ว
    await prisma.passwordReset.update({
      where: { id: resetRecord.id },
      data: { used: true },
    });

    console.log(`✅ รีเซ็ตรหัสผ่านสำเร็จสำหรับ user: ${resetRecord.user.email}`);

    return NextResponse.json({
      success: true,
      message: 'รีเซ็ตรหัสผ่านสำเร็จ กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่',
    });
  } catch (error: any) {
    console.error('❌ เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดำเนินการ' },
      { status: 500 }
    );
  }
}
