import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { BOOKINGFORM_CONFIG, ERROR_MESSAGES } from "@/lib/models/validation";

// ============================
// GET - ดึงรายการ BookingForm ทั้งหมด
// ============================
export async function GET(req: NextRequest) {
  try {
    const bookingForms = await prisma.bookingForm.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        contents: {
          include: {
            user: {
              select: { fullName: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ bookingForms }, { status: 200 });
  } catch (err) {
    console.error("GET booking form error:", err);
    return NextResponse.json(
      { error: ERROR_MESSAGES.DB_ERROR },
      { status: 500 }
    );
  }
}

// ============================
// POST - สร้าง BookingForm + Content (Optional)
// ============================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      type,
      batchNumber,
      totalSeats,
      startDate,
      endDate,
      priceType,
      singlePrice,
      batchPrices,
      souvenir,
      content, // Optional Content
    } = body;

    // --- Validation ---
    if (!priceType) {
      return NextResponse.json({ error: ERROR_MESSAGES.BOOKING_PRICE_TYPE_REQUIRED }, { status: 400 });
    }

    if (priceType === BOOKINGFORM_CONFIG.PRICE_TYPE.SINGLE && !singlePrice) {
      return NextResponse.json({ error: ERROR_MESSAGES.BOOKING_SINGLE_PRICE_REQUIRED }, { status: 400 });
    }

    if (
      priceType === BOOKINGFORM_CONFIG.PRICE_TYPE.BATCH &&
      (!batchPrices || batchPrices.length === 0)
    ) {
      return NextResponse.json({ error: ERROR_MESSAGES.BOOKING_BATCH_PRICE_REQUIRED }, { status: 400 });
    }

    // --- Transaction ---
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Booking Form
      const createdBookingForm = await tx.bookingForm.create({
        data: {
          Type: type || null,
          BatchNumber: batchNumber || null,
          TotalSeats: totalSeats || BOOKINGFORM_CONFIG.DEFAULT_SEATS,
          StartDate: startDate ? new Date(startDate) : null,
          EndDate: endDate ? new Date(endDate) : null,
          PriceType: priceType,
          singlePrice: priceType === BOOKINGFORM_CONFIG.PRICE_TYPE.SINGLE ? Number(singlePrice) : null,
          batchPrices: priceType === BOOKINGFORM_CONFIG.PRICE_TYPE.BATCH ? batchPrices : null,
          Souvenir: souvenir || null,
        },
      });

      // 2. Create Content (If provided)
      let createdContent = null;
      if (content) {
        createdContent = await tx.content.create({
          data: {
            Description: content.description ?? null,
            categories: content.categories ?? null,
            Booking: content.booking ?? "HAVE", // Default HAVE เพราะสร้างพร้อม Booking Form
            Userid: content.userId ?? null,
            BookingFormID: createdBookingForm.id,
            // Create Pictures relation
            pictures: {
              create: content.pictures?.map((path: string) => ({ Path: path })) ?? [],
            },
          },
          include: { pictures: true },
        });
      }

      return { bookingForm: createdBookingForm, content: createdContent };
    });

    return NextResponse.json(
      {
        message: ERROR_MESSAGES.BOOKING_CREATE_SUCCESS,
        bookingForm: result.bookingForm,
        content: result.content,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST booking form error:", err);
    return NextResponse.json({ error: ERROR_MESSAGES.DB_ERROR }, { status: 500 });
  }
}

// ============================
// PUT - อัปเดต BookingForm
// ============================
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      type,
      batchNumber,
      totalSeats,
      startDate,
      endDate,
      priceType,
      singlePrice,
      batchPrices,
      souvenir,
    } = body;

    if (!id) {
      return NextResponse.json({ error: ERROR_MESSAGES.BOOKING_ID_REQUIRED }, { status: 400 });
    }

    // Validation
    if (priceType === BOOKINGFORM_CONFIG.PRICE_TYPE.SINGLE && !singlePrice) {
      return NextResponse.json({ error: ERROR_MESSAGES.BOOKING_SINGLE_PRICE_REQUIRED }, { status: 400 });
    }

    if (priceType === BOOKINGFORM_CONFIG.PRICE_TYPE.BATCH && (!batchPrices || batchPrices.length === 0)) {
      return NextResponse.json({ error: ERROR_MESSAGES.BOOKING_BATCH_PRICE_REQUIRED }, { status: 400 });
    }

    // Update
    const updated = await prisma.bookingForm.update({
      where: { id },
      data: {
        Type: type || null,
        BatchNumber: batchNumber || null,
        TotalSeats: totalSeats || null,
        StartDate: startDate ? new Date(startDate) : null,
        EndDate: endDate ? new Date(endDate) : null,
        PriceType: priceType,
        singlePrice: priceType === BOOKINGFORM_CONFIG.PRICE_TYPE.SINGLE ? Number(singlePrice) : null,
        batchPrices: priceType === BOOKINGFORM_CONFIG.PRICE_TYPE.BATCH ? batchPrices : null,
        Souvenir: souvenir || null,
      },
    });

    return NextResponse.json(
      { message: ERROR_MESSAGES.BOOKING_UPDATE_SUCCESS, bookingForm: updated },
      { status: 200 }
    );
  } catch (err) {
    console.error("PUT booking form error:", err);
    return NextResponse.json({ error: ERROR_MESSAGES.DB_ERROR }, { status: 500 });
  }
}