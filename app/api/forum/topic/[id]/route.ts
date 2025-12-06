import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// GET - ดึงกระทู้และความคิดเห็นทั้งหมด
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const topicId = parseInt(id);

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
          where: { status: 'ACTIVE' },
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
    console.error('Error fetching topic:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    );
  }
}
