import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// POST - สร้างธุรกรรมการบริจาค
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      projectId,
      amount,
      message,
      isPublic,
      userId,
      donorName,
      donorEmail,
      donorPhone,
      paymentMethodId,
      paymentSlipUrl,
    } = body;

    if (!projectId || !amount) {
      return NextResponse.json(
        { error: 'กรุณาระบุโครงการและจำนวนเงิน' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่าโครงการเปิดรับบริจาคอยู่หรือไม่
    const project = await prisma.donationProject.findUnique({
      where: { id: projectId },
    });

    if (!project || project.status !== 'OPEN') {
      return NextResponse.json(
        { error: 'โครงการนี้ไม่เปิดรับบริจาค' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่าโครงการหมดเวลาหรือยัง
    if (new Date() > new Date(project.endDate)) {
      return NextResponse.json(
        { error: 'โครงการนี้หมดเวลารับบริจาคแล้ว' },
        { status: 400 }
      );
    }

    // สร้างธุรกรรมในฐานข้อมูล
    const result = await prisma.$transaction(async (tx) => {
      // สร้าง Payment Record
      const paymentRecord = await tx.paymentRecord.create({
        data: {
          amount: parseFloat(amount),
          paymentSlipUrl,
          paymentStatus: 'CONFIRMED',
          paymentMethodId,
        },
      });

      // สร้าง Donation Transaction
      const transaction = await tx.donationTransaction.create({
        data: {
          projectId,
          amount: parseFloat(amount),
          message,
          isPublic: isPublic !== false,
          userId,
          donorName,
          donorEmail,
          donorPhone,
          paymentId: paymentRecord.id,
          status: 'SUCCESS', // หรือ PENDING ถ้ารอการยืนยัน
        },
        include: {
          project: true,
          user: {
            select: {
              fullName: true,
              email: true,
            },
          },
          paymentRecord: {
            include: {
              paymentMethod: true,
            },
          },
        },
      });

      // อัพเดทยอดเงินในโครงการ
      await tx.donationProject.update({
        where: { id: projectId },
        data: {
          currentAmount: {
            increment: parseFloat(amount),
          },
        },
      });

      return transaction;
    });

    return NextResponse.json(
      {
        message: 'บริจาคสำเร็จ',
        transaction: result,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating donation transaction:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการบริจาค' },
      { status: 500 }
    );
  }
}

// GET - ดึงรายการธุรกรรมการบริจาค
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    const where: any = {};
    if (projectId) where.projectId = parseInt(projectId);
    if (userId) where.userId = parseInt(userId);
    if (status) where.status = status;

    const transactions = await prisma.donationTransaction.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            title: true,
          },
        },
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        paymentRecord: {
          include: {
            paymentMethod: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ transactions }, { status: 200 });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    );
  }
}

// PUT - อัพเดทสถานะธุรกรรม
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, paymentRefId } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'กรุณาระบุ ID ของธุรกรรม' },
        { status: 400 }
      );
    }

    const transaction = await prisma.$transaction(async (tx) => {
      const oldTransaction = await tx.donationTransaction.findUnique({
        where: { id },
        select: { status: true, amount: true, projectId: true },
      });

      if (!oldTransaction) {
        throw new Error('Transaction not found');
      }

      // อัพเดทธุรกรรม
      const updatedTransaction = await tx.donationTransaction.update({
        where: { id },
        data: {
          status,
          ...(paymentRefId && {
            paymentRecord: {
              update: {
                paymentRefId,
              },
            },
          }),
        },
        include: {
          project: true,
          paymentRecord: true,
        },
      });

      // ถ้าเปลี่ยนสถานะจาก SUCCESS เป็นอย่างอื่น ให้ลดยอดเงิน
      if (oldTransaction.status === 'SUCCESS' && status !== 'SUCCESS') {
        await tx.donationProject.update({
          where: { id: oldTransaction.projectId },
          data: {
            currentAmount: {
              decrement: oldTransaction.amount,
            },
          },
        });
      }

      // ถ้าเปลี่ยนสถานะจากอื่นเป็น SUCCESS ให้เพิ่มยอดเงิน
      if (oldTransaction.status !== 'SUCCESS' && status === 'SUCCESS') {
        await tx.donationProject.update({
          where: { id: oldTransaction.projectId },
          data: {
            currentAmount: {
              increment: oldTransaction.amount,
            },
          },
        });
      }

      return updatedTransaction;
    });

    return NextResponse.json(
      {
        message: 'อัพเดทสถานะธุรกรรมสำเร็จ',
        transaction,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัพเดทธุรกรรม' },
      { status: 500 }
    );
  }
}
