import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// GET - ดึงรายการ content ทั้งหมด
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const contents = await prisma.content.findMany({
      where: category
        ? {
            categories: category as any,
          }
        : undefined,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        bookingForm: true,
        status: true,
        pictures: true,
        bookings: {
          select: {
            id: true,
            transactionStatus: true,
            user: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ contents }, { status: 200 });
  } catch (error) {
    console.error('Error fetching contents:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    );
  }
}

// POST - สร้าง content ใหม่
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      description,
      author,
      userId,
      bookingFormId,
      statusId,
      categories,
      pictures,
    } = body;

    const content = await prisma.content.create({
      data: {
        Description: description,
        Author: author,
        Userid: userId,
        BookingFormID: bookingFormId,
        StatusID: statusId,
        categories: categories,
        pictures: {
          create: pictures?.map((path: string) => ({
            Path: path,
          })) || [],
        },
      },
      include: {
        user: true,
        bookingForm: true,
        status: true,
        pictures: true,
      },
    });

    return NextResponse.json(
      {
        message: 'สร้างเนื้อหาสำเร็จ',
        content,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating content:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสร้างเนื้อหา' },
      { status: 500 }
    );
  }
}
