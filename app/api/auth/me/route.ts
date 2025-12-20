import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/app/lib/prisma';

export async function GET(req: NextRequest) {
  // Get token from cookies
  const token = req.cookies.get('token')?.value;

  if (!token) {
    return NextResponse.json(
      { error: 'ไม่พบข้อมูลการเข้าสู่ระบบ' },
      { status: 401 }
    );
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || '') as {
      userId: number;
      email: string;
      role: string;
    };
  } catch (err) {
    return NextResponse.json(
      { error: 'Token ไม่ถูกต้องหรือหมดอายุ' },
      { status: 401 }
    );
  }

  try {
    // Get user data from database with relations
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        educationRecords: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        verification: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลผู้ใช้' },
        { status: 404 }
      );
    }

    // Check verification status (skip for ADMIN)
    if (user.role !== 'ADMIN') {
      if (!user.verification || user.verification.status !== 'APPROVED') {
        return NextResponse.json(
          { error: 'บัญชีของคุณยังไม่ได้รับการอนุมัติ' },
          { status: 403 }
        );
      }
    }

    // Transform response
    const response = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      address: user.address,
      subdistrict: user.subdistrict,
      district: user.district,
      province: user.province,
      postalCode: user.postalCode,
      role: user.role,
      education: user.educationRecords[0] || null,
      verification: user.verification || null
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดของเซิร์ฟเวอร์หรือฐานข้อมูล' },
      { status: 500 }
    );
  }
}
