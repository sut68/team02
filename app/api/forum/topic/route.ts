import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import jwt from 'jsonwebtoken';

// GET - ดึงรายการกระทู้
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const status = searchParams.get('status') || 'ACTIVE';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where = {
      status: status as any,
      ...(categoryId && { category_id: parseInt(categoryId) }),
    };

    const [topics, total] = await Promise.all([
      prisma.topic.findMany({
        where,
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
            select: {
              id: true,
              createddate: true,
              user: {
                select: {
                  fullName: true,
                },
              },
            },
            orderBy: { createddate: 'desc' },
            take: 1,
          },
        },
        orderBy: {
          lastactivitydate: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.topic.count({ where }),
    ]);

    return NextResponse.json(
      {
        topics,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    );
  }
}

// POST - สร้างกระทู้ใหม่
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, topicImage, user_id, category_id } = body;

    if (!title || !content || !user_id || !category_id) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      );
    }

    const topic = await prisma.topic.create({
      data: {
        title,
        content,
        topicImage,
        user_id,
        category_id,
        status: 'ACTIVE',
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        category: true,
      },
    });

    return NextResponse.json(
      {
        message: 'สร้างกระทู้สำเร็จ',
        topic,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสร้างกระทู้' },
      { status: 500 }
    );
  }
}

// PUT - อัพเดทกระทู้
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, content, topicImage, status, category_id, editedByUserId } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'กรุณาระบุ ID ของกระทู้' },
        { status: 400 }
      );
    }

    // Get current user from token
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'กรุณาเข้าสู่ระบบก่อน' },
        { status: 401 }
      );
    }

    // Verify token and get user ID
    const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as {
      userId: number;
      email: string;
      role: string;
    };
    const currentUserId = decoded.userId;

    // Get topic to check ownership
    const existingTopic = await prisma.topic.findUnique({
      where: { id },
      select: { user_id: true, content: true },
    });

    if (!existingTopic) {
      return NextResponse.json(
        { error: 'ไม่พบกระทู้' },
        { status: 404 }
      );
    }

    // Check if user is the owner (or admin)
    if (existingTopic.user_id !== currentUserId && decoded.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'คุณไม่มีสิทธิ์แก้ไขกระทู้นี้' },
        { status: 403 }
      );
    }

    // บันทึกประวัติการแก้ไข
    const oldTopic = existingTopic;

    const topic = await prisma.$transaction(async (tx) => {
      // สร้างประวัติการแก้ไข
      if (oldTopic && content && content !== oldTopic.content) {
        await tx.topicEditHistory.create({
          data: {
            topic_id: id,
            editedByUserID: editedByUserId?.toString() || 'system',
            oldcontent: oldTopic.content,
            staffuser_id: editedByUserId,
          },
        });
      }

      // อัพเดทกระทู้
      return tx.topic.update({
        where: { id },
        data: {
          ...(title && { title }),
          ...(content && { content }),
          ...(topicImage !== undefined && { topicImage }),
          ...(status && { status }),
          ...(category_id && { category_id }),
          lastactivitydate: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          category: true,
        },
      });
    });

    return NextResponse.json(
      {
        message: 'อัพเดทกระทู้สำเร็จ',
        topic,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in PUT /api/forum/topic:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัพเดทกระทู้' },
      { status: 500 }
    );
  }
}

// DELETE - ลบกระทู้ (เปลี่ยนสถานะเป็น DELETED)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const staffUserId = searchParams.get('staffUserId');
    const reason = searchParams.get('reason');

    if (!id) {
      return NextResponse.json(
        { error: 'กรุณาระบุ ID ของกระทู้' },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // เปลี่ยนสถานะกระทู้
      await tx.topic.update({
        where: { id: parseInt(id) },
        data: { status: 'DELETED' },
      });

      // บันทึก log
      if (staffUserId) {
        await tx.contentManagementLog.create({
          data: {
            targettype: 'TOPIC',
            TargetID: parseInt(id),
            status: 'DELETED',
            reason: reason || 'Deleted by admin',
            staffuser_id: parseInt(staffUserId),
          },
        });
      }
    });

    return NextResponse.json(
      { message: 'ลบกระทู้สำเร็จ' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบกระทู้' },
      { status: 500 }
    );
  }
}
