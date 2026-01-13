import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// GET - ดึงรายการวิธีการชำระเงิน
export async function GET() {
  try {
    const paymentMethods = await prisma.paymentMethodRecord.findMany({
      where: {
        // isActive: true,
      },
      orderBy: {
        methodName: 'asc',
      },
    });

    return NextResponse.json({ paymentMethods }, { status: 200 });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    );
  }
}

// POST - สร้างวิธีการชำระเงินใหม่
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { methodName, accountNumber, provider, isActive } = body;

    if (!methodName) {
      return NextResponse.json(
        { error: 'กรุณาระบุวิธีการชำระเงิน' },
        { status: 400 }
      );
    }

    const paymentMethod = await prisma.paymentMethodRecord.create({
      data: {
        methodName,
        accountNumber,
        provider,
        isActive: isActive !== false,
      },
    });

    return NextResponse.json(
      {
        message: 'เพิ่มวิธีการชำระเงินสำเร็จ',
        paymentMethod,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating payment method:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการเพิ่มวิธีการชำระเงิน' },
      { status: 500 }
    );
  }
}

// PUT - อัพเดทวิธีการชำระเงิน
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'กรุณาระบุ ID ของวิธีการชำระเงิน' },
        { status: 400 }
      );
    }

    const paymentMethod = await prisma.paymentMethodRecord.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(
      {
        message: 'อัพเดทวิธีการชำระเงินสำเร็จ',
        paymentMethod,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating payment method:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัพเดทวิธีการชำระเงิน' },
      { status: 500 }
    );
  }
}

// DELETE - ลบวิธีการชำระเงิน (soft delete โดยเปลี่ยน isActive)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'กรุณาระบุ ID ของวิธีการชำระเงิน' },
        { status: 400 }
      );
    }

    await prisma.paymentMethodRecord.update({
      where: { id: parseInt(id) },
      data: { isActive: false },
    });

    return NextResponse.json(
      { message: 'ปิดการใช้งานวิธีการชำระเงินสำเร็จ' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting payment method:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบวิธีการชำระเงิน' },
      { status: 500 }
    );
  }
}
