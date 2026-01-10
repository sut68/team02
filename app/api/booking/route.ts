import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { randomUUID } from "crypto";
import { BOOKING_API_CONFIG, ERROR_MESSAGES } from "@/lib/models/validation";

/* ------------------ Utils ------------------ */
function generateBookingNumber(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const r = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `BK${y}${m}${day}${r}`;
}

function computeAmountFromBookingForm(
  bookingForm: { PriceType: string | null; singlePrice: number | null; batchPrices: any } | null,
  batchNumber: string | null
): number {
  if (!bookingForm?.PriceType || bookingForm.PriceType === "FREE") return 0;

  if (bookingForm.PriceType === "SINGLE") {
    return Number(bookingForm.singlePrice ?? 0);
  }

  if (bookingForm.PriceType === "BY_BATCH") {
    const b = Number(batchNumber);
    if (!Number.isFinite(b)) return 0;

    const bp = bookingForm.batchPrices;
    if (Array.isArray(bp)) {
      const found = bp.find((r) => b >= Number(r.startBatch) && b <= Number(r.endBatch));
      return Number(found?.price ?? 0);
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
        bookingForm: {
          select: {
            TotalSeats: true,
            Souvenir: true,
            PriceType: true,
            singlePrice: true,
            batchPrices: true,
          },
        },
        souvenirItem: { select: { id: true } },
      },
    });

    if (!content) {
      return NextResponse.json({ error: ERROR_MESSAGES.CONTENT_NOT_FOUND }, { status: 404 });
    }

    /* Check Seats */
    const totalSeats = content.bookingForm?.TotalSeats ?? 0;
    const usedSeats = await prisma.attendee.count({
      where: {
        booking: {
          ContentID: Number(contentId),
          transactionStatus: BOOKING_API_CONFIG.TRANSACTION_STATUS.SUCCESS,
        },
      },
    });

    if (usedSeats >= totalSeats) {
      return NextResponse.json({ error: ERROR_MESSAGES.SEATS_FULL }, { status: 400 });
    }

    const qrToken = randomUUID();
    const bookingNumber = generateBookingNumber();
    const price = computeAmountFromBookingForm(content.bookingForm, bookingField?.batchNumber);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Booking Field
      const field = await tx.bookingField.create({
        data: {
          BatchNumber: bookingField?.batchNumber ? String(bookingField.batchNumber) : null,
          BookingSeats: BOOKING_API_CONFIG.DEFAULT_BOOKING_SEATS,
          Name: bookingField?.name ?? "",
          TotalPrice: price,
          Souvenir: bookingField?.souvenir ?? null,
          Note: bookingField?.note ?? null,
        },
      });

      // 2. Payment Record
      const payment = await tx.paymentRecord.create({
        data: {
          amount: price,
          paymentStatus: BOOKING_API_CONFIG.PAYMENT_STATUS.CONFIRMED,
        },
      });

      // 3. Booking
      const newBooking = await tx.booking.create({
        data: {
          Userid: Number(userId),
          ContentID: Number(contentId),
          BookingFieldID: field.id,
          payment: { connect: { id: payment.id } },
          qrToken,
          bookingNumber,
          transactionStatus: BOOKING_API_CONFIG.TRANSACTION_STATUS.SUCCESS,
        },
      });

      // 4. Attendee
      await tx.attendee.create({
        data: {
          Name: bookingField?.name ?? "",
          bookingId: newBooking.id,
        },
      });

      // 5. Entitlement (Souvenir)
      if (content.bookingForm?.Souvenir === "HAVE" && content.souvenirItem) {
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
        id: result.booking.id,
        bookingNumber: result.booking.bookingNumber,
        qrToken: result.booking.qrToken,
        eventName: content.TitleName,
      },
      paymentId: result.paymentId,
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: ERROR_MESSAGES.INTERNAL_ERROR }, { status: 500 });
  }
}

/* ------------------ GET: Scan QR ------------------ */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const id = searchParams.get("id");

  if (!token && !id) {
    return NextResponse.json({ success: false, error: ERROR_MESSAGES.TOKEN_REQUIRED }, { status: 400 });
  }

  const booking = await prisma.booking.findFirst({
    where: token ? { qrToken: token } : { id: Number(id) },
    include: {
      bookingField: true,
      content: { include: { bookingForm: true } },
      entitlement: { include: { item: true } },
      attendees: { include: { checkins: true } },
    },
  });

  if (!booking) {
    return NextResponse.json({ success: false, error: ERROR_MESSAGES.BOOKING_NOT_FOUND }, { status: 404 });
  }

  const isCheckedIn = booking.attendees.some((a) => a.checkins.length > 0);

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
      contentId: booking.ContentID,
      userId: booking.Userid,
      souvenirs: booking.entitlement.map((e) => ({
        itemName: e.item.name,
        claimed: e.qtyUsed >= e.qtyGranted,
      })),
    },
  });
}
export async function PATCH(request: NextRequest) {
  try {
    const { qrToken, action } = await request.json();

    const booking = await prisma.booking.findFirst({
      where: { qrToken },
      include: {
        attendees: { include: { checkins: true } },
        entitlement: true, // ดึงข้อมูลสิทธิ์มาด้วย (มี itemId อยู่ในนี้)
      },
    });

    if (!booking) {
      return NextResponse.json({ error: ERROR_MESSAGES.BOOKING_NOT_FOUND }, { status: 404 });
    }

    return await prisma.$transaction(async (tx) => {
      // ------------------------------------
      // 1. กรณี Check-in (เข้างาน)
      // ------------------------------------
      if (action === BOOKING_API_CONFIG.ACTIONS.CHECKIN) {
        const attendee = booking.attendees[0];
        // เช็คว่าเคยเช็คอินไปหรือยัง ถ้ายังให้สร้าง Log
        if (attendee && attendee.checkins.length === 0) {
          await tx.checkinLog.create({
            data: {
              AttendeeID: attendee.id,
              Name: attendee.Name,
            },
          });
        }
        return NextResponse.json({ success: true, message: ERROR_MESSAGES.CHECKIN_SUCCESS });
      }

      // ------------------------------------
      // 2. กรณีรับของที่ระลึก (Souvenir) 
      // ------------------------------------
      if (action === BOOKING_API_CONFIG.ACTIONS.SOUVENIR) {
        // 2.1 หา Entitlement ใบที่มีสิทธิ์เหลือ (qtyUsed < qtyGranted)
        const entitlementToUse = booking.entitlement.find((e) => e.qtyUsed < e.qtyGranted);
        
        // ถ้าไม่เจอ หรือใช้ครบแล้ว
        if (!entitlementToUse) {
          return NextResponse.json({ error: ERROR_MESSAGES.SOUVENIR_CLAIMED }, { status: 400 });
        }

        // 2.2 อัปเดตตัดสิทธิ์ (Increment qtyUsed)
        await tx.entitlement.update({
          where: { id: entitlementToUse.id },
          data: { qtyUsed: { increment: 1 } },
        });

        // 2.3 ✅ เพิ่ม: สร้างประวัติการแลก (Redemption)
        await tx.redemption.create({
          data: {
            entitlementId: entitlementToUse.id,
            itemId: entitlementToUse.itemId,
            userId: booking.Userid!, // มั่นใจว่ามี User เพราะผ่านการจองมาแล้ว
            method: "QR_SCAN",
            redeemedAt: new Date(),
          }
        });

        // 2.4 ✅ เพิ่ม: ตัดสต็อกจริง (StockMovement)
        await tx.stockMovement.create({
          data: {
            itemId: entitlementToUse.itemId,
            delta: -1,               // ลบ 1 ชิ้น
            reason: "redeem",        // สาเหตุ: แลกรับของ
            refType: "Redemption",
          }
        });
        
        return NextResponse.json({ success: true, message: ERROR_MESSAGES.SOUVENIR_SUCCESS });
      }

      return NextResponse.json({ success: true });
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: ERROR_MESSAGES.INTERNAL_ERROR }, { status: 500 });
  }
}