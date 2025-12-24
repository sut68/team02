// app/api/booking/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // ✅ จองทีละคน: ไม่ต้องใช้ attendees แล้ว (ถ้ายังส่งมา จะ ignore)
    const { userId, contentId, bookingField } = body;

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

    // ✅ จองทีละคน => seats = 1 เสมอ (ไม่รับค่าอื่น)
    const seats = 1;

    // ✅ validate “ที่นั่งคงเหลือ” แบบไม่ hardcode:
    // remaining = TotalSeats - sum(BookingSeats) ของ booking เดิมใน content เดียวกัน
    if (typeof content.bookingForm?.TotalSeats === "number") {
      const totalSeats = content.bookingForm.TotalSeats;

      const agg = await prisma.bookingField.aggregate({
        _sum: { BookingSeats: true },
        where: {
          booking: {
            ContentID: Number(contentId),
            // ถ้าอยากนับเฉพาะที่จ่ายเงินแล้ว ค่อยเพิ่ม filter transactionStatus ทีหลังได้
            // transactionStatus: { in: ["PENDING", "CONFIRMED"] } // ตัวอย่าง
          },
        },
      });

      const used = Number(agg._sum.BookingSeats ?? 0);
      const remaining = totalSeats - used;

      if (remaining < seats) {
        return NextResponse.json(
          { error: "ที่นั่งเต็มแล้ว" },
          { status: 400 }
        );
      }
    }

    // ✅ validate ชื่อ (จองทีละคนต้องมีชื่อ)
    const name =
      typeof bookingField?.name === "string" ? bookingField.name.trim() : "";
    if (!name) {
      return NextResponse.json(
        { error: "กรุณากรอกชื่อ-สกุล" },
        { status: 400 }
      );
    }

    // ✅ สร้างแบบ transaction: BookingField -> Booking
    const booking = await prisma.$transaction(async (tx) => {
      // 1) BookingField (ใช้ schema ใหม่: Name เดียว)
      const bookingFieldRecord = await tx.bookingField.create({
        data: {
          BatchNumber: bookingField?.batchNumber ?? null,
          BookingSeats: seats, // ✅ 1 เสมอ
          Name: name, // ✅ ชื่อเดียว
          TotalPrice: bookingField?.totalPrice ?? null,
          Souvenir: bookingField?.souvenir ?? null,
          Note: bookingField?.note ?? null,
        },
      });

      // 2) Booking
      const newBooking = await tx.booking.create({
        data: {
          Userid: Number(userId),
          ContentID: Number(contentId),
          BookingFieldID: bookingFieldRecord.id,

          // ⚠️ ถ้า schema จริงของ bro ยังมี bookingFormId อยู่ ให้เปิดใช้บรรทัดนี้
          // bookingFormId: realBookingFormId,

          // ✅ ไม่สร้าง attendees แล้ว เพราะจองทีละคน
        },
        include: {
          user: true,
          content: true,
          bookingField: true,
          // attendees: true, // ✅ ถ้าไม่ใช้แล้ว จะตัดออกได้ แต่ไม่จำเป็นต้องแก้ก็ได้
          // bookingForm: true, // ✅ ถ้า schema ไม่มี relation นี้ ก็อย่า include
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
