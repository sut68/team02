import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// GET - ดึงความคิดเห็นของกระทู้
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const topicId = searchParams.get('topicId');

    if (!topicId) {
      return NextResponse.json(
        { error: 'กรุณาระบุ ID ของกระทู้' },
        { status: 400 }
      );
    }

    const comments = await prisma.comment.findMany({
      where: {
        topic_id: parseInt(topicId),
        status: 'ACTIVE',
      },
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
    });

    return NextResponse.json({ comments }, { status: 200 });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    );
  }
}

// POST - สร้างความคิดเห็นใหม่
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, topic_id, user_id } = body;

    if (!content || !topic_id || !user_id) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      );
    }

    // สร้างความคิดเห็นและอัพเดทจำนวนความคิดเห็นในกระทู้
    const comment = await prisma.$transaction(async (tx) => {
      const newComment = await tx.comment.create({
        data: {
          content,
          topic_id,
          user_id,
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
        },
      });

      // อัพเดทจำนวนความคิดเห็นและเวลาล่าสุดของกระทู้
      await tx.topic.update({
        where: { id: topic_id },
        data: {
          commentcount: {
            increment: 1,
          },
          lastactivitydate: new Date(),
        },
      });

      return newComment;
    });

    return NextResponse.json(
      {
        message: 'เพิ่มความคิดเห็นสำเร็จ',
        comment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการเพิ่มความคิดเห็น' },
      { status: 500 }
    );
  }
}

// PUT - อัพเดทความคิดเห็น
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, content, status } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'กรุณาระบุ ID ของความคิดเห็น' },
        { status: 400 }
      );
    }

    const comment = await prisma.comment.update({
      where: { id },
      data: {
        ...(content && { content }),
        ...(status && { status }),
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: 'อัพเดทความคิดเห็นสำเร็จ',
        comment,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัพเดทความคิดเห็น' },
      { status: 500 }
    );
  }
}

// DELETE - ลบความคิดเห็น (เปลี่ยนสถานะเป็น DELETED)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const staffUserId = searchParams.get('staffUserId');
    const reason = searchParams.get('reason');

    if (!id) {
      return NextResponse.json(
        { error: 'กรุณาระบุ ID ของความคิดเห็น' },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // ดึงข้อมูล comment เพื่อหา topic_id
      const comment = await tx.comment.findUnique({
        where: { id: parseInt(id) },
        select: { topic_id: true },
      });

      if (!comment) {
        throw new Error('Comment not found');
      }

      // เปลี่ยนสถานะความคิดเห็น
      await tx.comment.update({
        where: { id: parseInt(id) },
        data: { status: 'DELETED' },
      });

      // ลดจำนวนความคิดเห็นในกระทู้
      await tx.topic.update({
        where: { id: comment.topic_id },
        data: {
          commentcount: {
            decrement: 1,
          },
        },
      });

      // บันทึก log
      if (staffUserId) {
        await tx.contentManagementLog.create({
          data: {
            targettype: 'COMMENT',
            TargetID: parseInt(id),
            status: 'DELETED',
            reason: reason || 'Deleted by admin',
            staffuser_id: parseInt(staffUserId),
          },
        });
      }
    });

    return NextResponse.json(
      { message: 'ลบความคิดเห็นสำเร็จ' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบความคิดเห็น' },
      { status: 500 }
    );
  }
}
