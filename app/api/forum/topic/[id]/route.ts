import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import jwt from 'jsonwebtoken';

// GET - ดึงกระทู้และความคิดเห็นทั้งหมด
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const topicId = parseInt(id);

    // ตรวจสอบว่าเป็น Admin หรือไม่
    let isAdmin = false;
    const token = request.cookies.get('token')?.value;
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as { role: string };
        if (decoded.role === 'ADMIN') {
          isAdmin = true;
        }
      } catch (err) {
        // Token ไม่ถูกต้อง หรือหมดอายุ
      }
    }

    // กำหนดเงื่อนไขการดึงคอมเมนต์
    const commentWhereClause = isAdmin 
      ? {} 
      : { status: 'ACTIVE' as const }; // ← เพิ่ม 'as const'

    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
        category: true,
        comments: {
          where: commentWhereClause,
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: {
            createddate: 'asc',
          },
        },
        editHistory: {
          orderBy: {
            editdate: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!topic) {
      return NextResponse.json(
        { error: 'ไม่พบกระทู้' },
        { status: 404 }
      );
    }

    return NextResponse.json({ topic }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    );
  }
}