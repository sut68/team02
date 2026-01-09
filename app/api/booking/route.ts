import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { randomUUID } from "crypto";

/* ------------------ Utils ------------------ */
function generateBookingNumber(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const r = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `BK${y}${m}${day}${r}`;
}

function computeAmountFromBookingForm(
  bookingForm: {
    PriceType: string | null;
    singlePrice: number | null;
    batchPrices: any;
  } | null,
  batchNumber: string | null
): number {
  if (!bookingForm?.PriceType) return 0;
  if (bookingForm.PriceType === "FREE") return 0;

  if (bookingForm.PriceType === "SINGLE") {
    return Number(bookingForm.singlePrice ?? 0);
  }

  if (bookingForm.PriceType === "BY_BATCH") {
    const b = Number(batchNumber);
    if (!Number.isFinite(b)) return 0;

    const bp = bookingForm.batchPrices;
    if (Array.isArray(bp)) {
      const found = bp.find(
        (r) => b >= Number(r.startBatch) && b <= Number(r.endBatch)
      );
      return Number(found?.price ?? 0);
    }

    if (typeof bp === "object") {
      return Number(bp[String(b)] ?? 0);
    }
  }

  return 0;
}

/* ------------------ POST: Create Booking ------------------ */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, contentId, bookingField } = body;

    const content = await prisma.content.findUnique({
      where: { id: Number(contentId) },
      select: {
        TitleName: true,
        Booking: true,
        bookingForm: {
          select: {
            TotalSeats: true,
            Souvenir: true,
            PriceType: true,
            singlePrice: true,
            batchPrices: true,
          },
        },
        souvenirItem: {
          select: { id: true, name: true },
        },
      },
    });

    if (!content) {
      return NextResponse.json({ error: "ไม่พบกิจกรรม" }, { status: 404 });
    }

    /* --------- ✅ เช็คที่นั่งคงเหลือ --------- */
    const totalSeats = content.bookingForm?.TotalSeats ?? 0;

    const usedSeats = await prisma.attendee.count({
      where: {
        booking: {
          ContentID: Number(contentId),
          transactionStatus: "SUCCESS",
        },
      },
    });

    if (usedSeats >= totalSeats) {
      return NextResponse.json(
        { error: "ที่นั่งเต็มแล้ว" },
        { status: 400 }
      );
    }

    const qrToken = randomUUID();
    const bookingNumber = generateBookingNumber();
    const price = computeAmountFromBookingForm(
      content.bookingForm,
      bookingField?.batchNumber
    );

    const booking = await prisma.$transaction(async (tx) => {
      const bookingFieldRecord = await tx.bookingField.create({
        data: {
          BatchNumber: bookingField?.batchNumber
            ? String(bookingField.batchNumber)
            : null,
          BookingSeats: 1,
          Name: bookingField?.name ?? "",
          TotalPrice: price,
          Souvenir: bookingField?.souvenir ?? null,
          Note: bookingField?.note ?? null,
        },
      });

      const payment = await tx.paymentRecord.create({
        data: {
          amount: price,
          paymentStatus: "CONFIRMED",
        },
      });

      const newBooking = await tx.booking.create({
        data: {
          Userid: Number(userId),
          ContentID: Number(contentId),
          BookingFieldID: bookingFieldRecord.id,
          payment: { connect: { id: payment.id }},
          qrToken,
          bookingNumber,
          transactionStatus: "SUCCESS", // ✅ สำคัญมาก
        },
        
      });

      await tx.attendee.create({
        data: {
          Name: bookingField?.name ?? "",
          bookingId: newBooking.id,
        },
      });

      if (
        content.bookingForm?.Souvenir === "HAVE" &&
        content.souvenirItem
      ) {
        await tx.entitlement.create({
          data: {
            userId: Number(userId),
            itemId: content.souvenirItem.id,
            source: "BOOKING",
            bookingId: newBooking.id,
            qtyGranted: 1,
            qtyUsed: 0,
            redeemToken: randomUUID(),
          },
        });
      }

      return { booking: newBooking, paymentId: payment.id };
    });

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.booking.id,
        bookingNumber: booking.booking.bookingNumber,
        qrToken: booking.booking.qrToken,
        eventName: content.TitleName,
      },
      paymentId: booking.paymentId,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/* ------------------ GET: Scan QR (fix) ------------------ */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
const id = searchParams.get("id");

if (!token && !id) {
  return NextResponse.json(
    { success: false, error: "ไม่มี token หรือ id ส่งมา" },
    { status: 400 }
  );
}


  const booking = await prisma.booking.findFirst({
  where: token
    ? { qrToken: token }
    : { id: Number(id) },
  include: {
    bookingField: true,
    content: { include: { bookingForm: true } },
    entitlement: { include: { item: true } },
    attendees: { include: { checkins: true } },
  },
});


  if (!booking) {
    console.log("❌ Search failed for qrToken:", token);
    return NextResponse.json(
      { success: false, error: "ไม่พบข้อมูลการจอง" },
      { status: 404 }
    );
  }

  const isCheckedIn = booking.attendees.some(
    (a) => a.checkins.length > 0
  );

  return NextResponse.json({
    success: true,
    booking: {
      id: booking.id,
      bookingNumber: booking.bookingNumber,
      userName: booking.bookingField?.Name,
      eventName: booking.content?.TitleName,
      qrToken: booking.qrToken,
      totalSeats: booking.content?.bookingForm?.TotalSeats ?? 0,
      isCheckedIn,
      souvenirs: booking.entitlement.map((e) => ({
        itemName: e.item.name,
        claimed: e.qtyUsed >= e.qtyGranted,
      })),
    },
  });
}

/* ------------------ PATCH: Check-in / Souvenir ------------------ */
export async function PATCH(request: NextRequest) {
  try {
    const { qrToken, action } = await request.json();

    const booking = await prisma.booking.findUnique({
      where: { qrToken },
      include: {
        attendees: { include: { checkins: true } },
        entitlement: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });
    }

    return await prisma.$transaction(async (tx) => {
      if (action === "CHECKIN") {
        const attendee = booking.attendees[0];
        if (attendee.checkins.length > 0) {
          return NextResponse.json({ success: true });
        }

        await tx.checkinLog.create({
          data: {
            AttendeeID: attendee.id,
            Name: attendee.Name,
          },
        });
      }

      if (action === "SOUVENIR") {
        const canClaim = booking.entitlement.some(
          (e) => e.qtyUsed < e.qtyGranted
        );
        if (!canClaim) {
          return NextResponse.json(
            { error: "รับของครบแล้ว" },
            { status: 400 }
          );
        }

        await tx.entitlement.updateMany({
          where: { bookingId: booking.id },
          data: { qtyUsed: { increment: 1 } },
        });
      }

      return NextResponse.json({ success: true });
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}