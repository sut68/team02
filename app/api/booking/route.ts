import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// GET - ดึงรายการ booking ทั้งหมด
export async function GET(request: NextRequest) {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        content: true,
        bookingField: true,
        payment: true,
        attendees: {
          include: {
            checkins: true,
          },
        },
        bookingForm: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ bookings }, { status: 200 });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    );
  }
}

// POST - สร้าง booking ใหม่
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      contentId,
      bookingFormId,
      bookingField,
      attendees,
    } = body;

    // สร้าง booking พร้อม relation ใน transaction
    const booking = await prisma.$transaction(async (tx) => {
      // 1. สร้าง BookingField ก่อน
      let bookingFieldRecord = null;
      if (bookingField) {
        bookingFieldRecord = await tx.bookingField.create({
          data: {
            BatchNumber: bookingField.batchNumber,
            BookingSeats: bookingField.bookingSeats,
            Name1: bookingField.name1,
            Name2: bookingField.name2,
            Name3: bookingField.name3,
            Name4: bookingField.name4,
            TotalPrice: bookingField.totalPrice,
            Souvenir: bookingField.souvenir,
            Note: bookingField.note,
          },
        });
      }

      // 2. สร้าง Booking
      const newBooking = await tx.booking.create({
        data: {
          Userid: userId,
          ContentID: contentId,
          bookingFormId: bookingFormId,
          BookingFieldID: bookingFieldRecord?.id,
          transactionStatus: 'PENDING',
          attendees: {
            create: attendees?.map((name: string) => ({
              Name: name,
            })) || [],
          },
        },
        include: {
          user: true,
          content: true,
          bookingField: true,
          attendees: true,
        },
      });

      return newBooking;
    });

    return NextResponse.json(
      {
        message: 'สร้างการจองสำเร็จ',
        booking,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสร้างการจอง' },
      { status: 500 }
    );
  }
}