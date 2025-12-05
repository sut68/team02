import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// GET - ดึงรายการ booking form ทั้งหมด
export async function GET(request: NextRequest) {
  try {
    const bookingForms = await prisma.bookingForm.findMany({
      include: {
        contents: {
          include: {
            user: {
              select: {
                fullName: true,
              },
            },
          },
        },
        bookings: {
          select: {
            id: true,
            transactionStatus: true,
            Date: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ bookingForms }, { status: 200 });
  } catch (error) {
    console.error('Error fetching booking forms:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    );
  }
}

// POST - สร้าง booking form ใหม่
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      type,
      batchNumber,
      totalSeats,
      startDate,
      endDate,
      priceType,
      batchPrices,
      souvenir,
    } = body;

    const bookingForm = await prisma.bookingForm.create({
      data: {
        Type: type,
        BatchNumber: batchNumber,
        TotalSeats: totalSeats,
        StartDate: startDate ? new Date(startDate) : undefined,
        EndDate: endDate ? new Date(endDate) : undefined,
        PriceType: priceType,
        batchPrices: batchPrices,
        Souvenir: souvenir,
      },
    });

    return NextResponse.json(
      {
        message: 'สร้างฟอร์มการจองสำเร็จ',
        bookingForm,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating booking form:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสร้างฟอร์ม' },
      { status: 500 }
    );
  }
}

// PUT - อัพเดท booking form
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'กรุณาระบุ ID ของฟอร์ม' },
        { status: 400 }
      );
    }

    const bookingForm = await prisma.bookingForm.update({
      where: { id },
      data: {
        Type: updateData.type,
        BatchNumber: updateData.batchNumber,
        TotalSeats: updateData.totalSeats,
        StartDate: updateData.startDate ? new Date(updateData.startDate) : undefined,
        EndDate: updateData.endDate ? new Date(updateData.endDate) : undefined,
        PriceType: updateData.priceType,
        batchPrices: updateData.batchPrices,
        Souvenir: updateData.souvenir,
      },
    });

    return NextResponse.json(
      {
        message: 'อัพเดทฟอร์มสำเร็จ',
        bookingForm,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating booking form:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัพเดทฟอร์ม' },
      { status: 500 }
    );
  }
}
