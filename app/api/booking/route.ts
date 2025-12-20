// app/api/booking/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, contentId, bookingField, attendees } = body;

    if (!userId || !contentId) {
      return NextResponse.json(
        { error: "ต้องระบุ userId และ contentId" },
        { status: 400 }
      );
    }

    // ✅ ดึง bookingForm ที่ “ผูกกับ content” เท่านั้น
    const content = await prisma.content.findUnique({
      where: { id: Number(contentId) },
      select: {
        Booking: true,
        BookingFormID: true,
        bookingForm: {
          select: {
            id: true,
            TotalSeats: true,
            Souvenir: true,
            PriceType: true,
            singlePrice: true,
            batchPrices: true,
          },
        },
      },
    });

    if (!content) {
      return NextResponse.json({ error: "ไม่พบ content" }, { status: 404 });
    }

    if (content.Booking !== "HAVE") {
      return NextResponse.json(
        { error: "กิจกรรมนี้ไม่ได้เปิดให้จอง" },
        { status: 400 }
      );
    }

    const realBookingFormId = content.BookingFormID;
    if (!realBookingFormId) {
      return NextResponse.json(
        { error: "กิจกรรมนี้ยังไม่มี bookingForm ผูกอยู่" },
        { status: 400 }
      );
    }

    // ✅ validate จำนวนที่นั่งไม่ให้เกิน TotalSeats (ถ้ามี)
    const seats = Number(bookingField?.bookingSeats ?? 1);
    if (!Number.isFinite(seats) || seats < 1) {
      return NextResponse.json(
        { error: "จำนวนที่นั่งไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    if (content.bookingForm?.TotalSeats && seats > content.bookingForm.TotalSeats) {
      return NextResponse.json(
        { error: `จำนวนที่นั่งเกินที่กำหนด (สูงสุด ${content.bookingForm.TotalSeats})` },
        { status: 400 }
      );
    }

    // ✅ สร้างแบบ transaction: BookingField -> Booking -> Attendees
    const booking = await prisma.$transaction(async (tx) => {
      // 1) BookingField
      const bookingFieldRecord = await tx.bookingField.create({
        data: {
          BatchNumber: bookingField?.batchNumber ?? null,     // String?
          BookingSeats: seats,                                // Int?
          Name1: bookingField?.name1 ?? null,
          Name2: bookingField?.name2 ?? null,
          Name3: bookingField?.name3 ?? null,
          Name4: bookingField?.name4 ?? null,
          TotalPrice: bookingField?.totalPrice ?? null,       // Int?
          Souvenir: bookingField?.souvenir ?? null,           // String? (แนะนำเก็บ "HAVE"/"NOT" หรือชื่อ item)
          Note: bookingField?.note ?? null,
        },
      });

      // 2) Booking (ผูก bookingFormId จาก content เท่านั้น)
      const newBooking = await tx.booking.create({
        data: {
          Userid: Number(userId),
          ContentID: Number(contentId),
          bookingFormId: realBookingFormId,
          BookingFieldID: bookingFieldRecord.id,
          // transactionStatus ไม่ต้อง set ก็ได้ เพราะ schema default(PENDING) อยู่แล้ว
          attendees: {
            create:
              (attendees ?? [])
                .filter((x: any) => typeof x === "string" && x.trim() !== "")
                .map((name: string) => ({ Name: name.trim() })),
          },
        },
        include: {
          user: true,
          content: true,
          bookingField: true,
          attendees: true,
          bookingForm: true,
        },
      });

      return newBooking;
    });

    return NextResponse.json(
      { message: "สร้างการจองสำเร็จ", booking },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการสร้างการจอง" },
      { status: 500 }
    );
  }
}
