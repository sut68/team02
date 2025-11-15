import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/app/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    // Get token from cookies
    const token = req.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลการเข้าสู่ระบบ' },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as {
      userId: number;
      email: string;
      userType: string;
    };

    // Get user data from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        userType: true,
        status: true,
        phone: true,
        address: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลผู้ใช้' },
        { status: 404 }
      );
    }

    if (user.status !== 'approved') {
      return NextResponse.json(
        { error: 'บัญชีของคุณยังไม่ได้รับการอนุมัติ' },
        { status: 403 }
      );
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'ข้อมูลการเข้าสู่ระบบไม่ถูกต้อง' },
      { status: 401 }
    );
  }
}
