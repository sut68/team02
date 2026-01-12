import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import jwt from 'jsonwebtoken';

// POST - สร้างความคิดเห็นใหม่ในกระทู้
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const topicId = parseInt(id);

    if (isNaN(topicId)) {
      return NextResponse.json(
        { error: 'ID ของกระทู้ไม่ถูกต้อง' },
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
    const userId = decoded.userId;

    const body = await request.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'กรุณากรอกความคิดเห็น' },
        { status: 400 }
      );
    }

    // Verify topic exists
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      select: { id: true, status: true },
    });

    if (!topic) {
      return NextResponse.json({ error: 'ไม่พบกระทู้' }, { status: 404 });
    }

    if (topic.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'ไม่สามารถแสดงความคิดเห็นในกระทู้นี้ได้' },
        { status: 403 }
      );
    }

    // สร้างความคิดเห็นและอัพเดทจำนวนความคิดเห็นในกระทู้
    const comment = await prisma.$transaction(async (tx) => {
      const newComment = await tx.comment.create({
        data: {
          content: content.trim(),
          topic_id: topicId,
          user_id: userId,
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
      });

      // อัพเดทจำนวนความคิดเห็นและเวลาล่าสุดของกระทู้
      await tx.topic.update({
        where: { id: topicId },
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
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการเพิ่มความคิดเห็น' },
      { status: 500 }
    );
  }
}

// DELETE - ลบความคิดเห็น (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await params; // Topic ID - not used but required by route structure
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('commentId');

    if (!commentId) {
      return NextResponse.json(
        { error: 'กรุณาระบุ ID ของความคิดเห็น' },
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

    // Check if user is admin
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'คุณไม่มีสิทธิ์ลบความคิดเห็น' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { reasonForDeletion } = body;

    if (!reasonForDeletion) {
      return NextResponse.json(
        { error: 'กรุณาเลือกเหตุผลในการลบ' },
        { status: 400 }
      );
    }

    // Delete comment and update topic count
    await prisma.$transaction(async (tx) => {
      // Get comment to find topic_id
      const comment = await tx.comment.findUnique({
        where: { id: parseInt(commentId) },
        select: { topic_id: true, status: true },
      });

      if (!comment) {
        throw new Error('Comment not found');
      }

      // Update comment status and reason
      await tx.comment.update({
        where: { id: parseInt(commentId) },
        data: {
          status: 'DELETED',
          reasonForDeletion: reasonForDeletion,
        },
      });

      // Decrement comment count only if comment was ACTIVE
      if (comment.status === 'ACTIVE') {
        await tx.topic.update({
          where: { id: comment.topic_id },
          data: {
            commentcount: {
              decrement: 1,
            },
          },
        });
      }

      // Log the deletion
      await tx.contentManagementLog.create({
        data: {
          targettype: 'COMMENT',
          TargetID: parseInt(commentId),
          status: 'DELETED',
          reason: reasonForDeletion,
          staffuser_id: decoded.userId,
        },
      });
    });

    return NextResponse.json(
      { message: 'ลบความคิดเห็นสำเร็จ' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบความคิดเห็น' },
      { status: 500 }
    );
  }
}
