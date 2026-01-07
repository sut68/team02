// app/api/booking/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

function computeAmountFromBookingForm(
  bookingForm: {
    PriceType: string | null;
    singlePrice: number | null;
    batchPrices: any; // Json
  } | null | undefined,
  batchNumber: string | null
): number {
  if (!bookingForm?.PriceType) return 0;

  if (bookingForm.PriceType === "FREE") return 0;

  if (bookingForm.PriceType === "SINGLE") {
    return Number(bookingForm.singlePrice ?? 0);
  }

  if (bookingForm.PriceType === "BY_BATCH") {
    // รูปแบบ batchPrices แล้วแต่ bro เก็บ
    // ตัวอย่างที่เจอบ่อย:
    // 1) [{ startBatch: 1, endBatch: 10, price: 500 }, ...]
    // 2) { "1": 500, "2": 600 } (map)
    const b = batchNumber ? Number(batchNumber) : NaN;
    if (!Number.isFinite(b)) return 0;

    const bp = bookingForm.batchPrices;

    // case: array ranges
    if (Array.isArray(bp)) {
      const found = bp.find((row) => {
        const s = Number(row?.startBatch);
        const e = Number(row?.endBatch);
        return Number.isFinite(s) && Number.isFinite(e) && b >= s && b <= e;
      });
      return Number(found?.price ?? 0);
    }

    // case: object map
    if (bp && typeof bp === "object") {
      const v = (bp as any)[String(b)];
      return Number(v ?? 0);
    }

    return 0;
  }

  return 0;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, contentId, bookingField } = body;

    if (!userId || !contentId) {
      return NextResponse.json(
        { error: "ต้องระบุ userId และ contentId" },
        { status: 400 }
      );
    }

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
    if (!content.BookingFormID) {
      return NextResponse.json(
        { error: "กิจกรรมนี้ยังไม่มี bookingForm ผูกอยู่" },
        { status: 400 }
      );
    }

    // จองทีละคน
    const seats = 1;

    // validate ที่นั่งคงเหลือ
    if (typeof content.bookingForm?.TotalSeats === "number") {
      const totalSeats = content.bookingForm.TotalSeats;

      const agg = await prisma.bookingField.aggregate({
        _sum: { BookingSeats: true },
        where: {
          booking: {
            ContentID: Number(contentId),
          },
        },
      });

      const used = Number(agg._sum.BookingSeats ?? 0);
      const remaining = totalSeats - used;

      if (remaining < seats) {
        return NextResponse.json({ error: "ที่นั่งเต็มแล้ว" }, { status: 400 });
      }
    }

    // validate ชื่อ
    const name =
      typeof bookingField?.name === "string" ? bookingField.name.trim() : "";
    if (!name) {
      return NextResponse.json(
        { error: "กรุณากรอกชื่อ-สกุล" },
        { status: 400 }
      );
    }

    const batchNumber =
      bookingField?.batchNumber != null ? String(bookingField.batchNumber) : null;

    // ✅ คำนวณยอดจาก bookingForm (server-side)
    const amount = computeAmountFromBookingForm(content.bookingForm, batchNumber);

    // เตรียม Object สำหรับสร้าง Payment (แยกออกมาเพื่อให้โค้ดอ่านง่าย)
    const paymentCreateData: any = {
      amount: amount,
      transactionCode: null,
      paymentSlipUrl: null,
      paymentStatus: "PENDING",
    };

    // เช็คว่ามีการส่ง paymentMethodId มาหรือไม่ (ถ้ามีให้ใส่เข้าไป)
    if (bookingField?.paymentMethodId) {
      paymentCreateData.paymentMethodId = Number(bookingField.paymentMethodId);
    }

    const booking = await prisma.$transaction(async (tx) => {
      
      // ✅ แก้ไข: ใช้ Nested Write สร้างทุกอย่างในคำสั่งเดียว
      const newBooking = await tx.booking.create({
        data: {
          // 1. เชื่อม Relation หลัก (User, Content)
          user: { connect: { id: Number(userId) } },
          content: { connect: { id: Number(contentId) } },

          // 2. สร้าง BookingField ซ้อนเข้าไป
          bookingField: {
            create: {
              BatchNumber: batchNumber,
              BookingSeats: seats,
              Name: name,
              TotalPrice: amount,
              Souvenir: bookingField?.souvenir ?? null,
              Note: bookingField?.note ?? null,
            }
          },

          // 3. สร้าง Payment ซ้อนเข้าไป (เหมือนตัวอย่าง Donation)
          // หมายเหตุ: เช็คชื่อ relation ใน schema.prisma ว่าชื่อ 'payment' หรือ 'paymentRecord'
          // จาก schema ก่อนหน้านี้คุณใช้ชื่อ 'payment'
          payment: {
            create: paymentCreateData
          },

          // กำหนดสถานะ Booking
          transactionStatus: "PENDING",
        },
        include: {
          user: true,
          content: true,
          bookingField: true,
          payment: true, // หรือ paymentRecord ตามชื่อ relation ใน schema
        },
      });

      return newBooking;
    });

    return NextResponse.json(
      { 
        message: "สร้างการจอง + สร้างรายการชำระเงินสำเร็จ", 
        booking,
        // ส่ง paymentId กลับไปเผื่อ frontend ต้องใช้
        paymentId: booking.payment?.id 
      },
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