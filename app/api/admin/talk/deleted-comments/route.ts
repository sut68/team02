import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import jwt from 'jsonwebtoken';

export async function GET(req: NextRequest) {
  try {
    // 1. ตรวจสอบสิทธิ์ Admin
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as { role: string };
      if (decoded.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } catch (err) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // 2. ดึงข้อมูลความคิดเห็นที่ถูกลบ - แก้ตรงนี้
    const comments = await prisma.comment.findMany({
      where: {
        status: 'DELETED' as const, // ← เปลี่ยนจาก reasonForDeletion เป็น status
      },
      select: {
        id: true,
        content: true,
        status: true, // ← เพิ่ม
        reasonForDeletion: true,
        createddate: true,
        user: {
          select: {
            fullName: true,
            email: true,
          },
        },
        topic: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createddate: 'desc',
      },
    });

    return NextResponse.json({ comments }, { status: 200 });

  } catch (error) {
    console.error('Error fetching deleted comments:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    );
  }
}