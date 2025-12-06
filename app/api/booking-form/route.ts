import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

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
        bookings: {
          select: {
            id: true,
            transactionStatus: true,
            Date: true,
          },
        },
      },
    });

    return NextResponse.json({ bookingForms }, { status: 200 });
  } catch (err) {
    console.error("GET booking form error:", err);
    return NextResponse.json(
      { error: "ดึงข้อมูลฟอร์มไม่สำเร็จ" },
      { status: 500 }
    );
  }
}

// ============================
// POST - สร้าง BookingForm ใหม่
// ============================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      // ------ ของ BookingForm เดิม ------
      type,
      batchNumber,
      totalSeats,
      startDate,
      endDate,
      priceType,
      singlePrice,
      batchPrices,
      souvenir,

      // ------ ของ Content ใหม่ ------
      content, // 👈 object สำหรับสร้าง Content + PictureContent
    } = body;

    // --------------------
    // VALIDATE ขั้นพื้นฐาน (เหมือนของเดิม)
    // --------------------
    if (!priceType) {
      return NextResponse.json(
        { error: "กรุณาระบุรูปแบบราคา (PriceType)" },
        { status: 400 }
      );
    }

    if (priceType === "SINGLE" && !singlePrice) {
      return NextResponse.json(
        { error: "PriceType = SINGLE ต้องระบุ singlePrice" },
        { status: 400 }
      );
    }

    if (
      priceType === "BY_BATCH" &&
      (!batchPrices || batchPrices.length === 0)
    ) {
      return NextResponse.json(
        {
          error:
            "PriceType = BY_BATCH ต้องมี batchPrices อย่างน้อย 1 รายการ",
        },
        { status: 400 }
      );
    }

    // --------------------
    // ใช้ TRANSACTION: สร้าง BookingForm + Content พร้อมกัน
    // --------------------
    const result = await prisma.$transaction(async (tx) => {
      // 1) สร้าง BookingForm ก่อน
      const createdBookingForm = await tx.bookingForm.create({
        data: {
          Type: type || null,
          BatchNumber: batchNumber || null,
          TotalSeats: totalSeats || null,
          StartDate: startDate ? new Date(startDate) : null,
          EndDate: endDate ? new Date(endDate) : null,
          PriceType: priceType,
          singlePrice: priceType === "SINGLE" ? Number(singlePrice) : null,
          batchPrices: priceType === "BY_BATCH" ? batchPrices : null,
          Souvenir: souvenir || null,
        },
      });

      // 2) ถ้ามีส่ง content มาด้วย → สร้าง Content ผูกกับ BookingFormID นี้
      let createdContent = null;

      if (content) {
        const {
          description,
          categories,
          booking,     // Option (HAVE / NOT)
          userId,
          pictures,    // string[] => Path ของ PictureContent
        } = content;

        createdContent = await tx.content.create({
          data: {
            Description: description ?? null,
            categories: categories ?? null, // ต้องส่งมาเป็น enum string
            Booking: booking ?? null,
            Userid: userId ?? null,
            BookingFormID: createdBookingForm.id,
            pictures: {
              create:
                pictures?.map((path: string) => ({
                  Path: path,
                })) ?? [],
            },
          },
          include: {
            pictures: true,
          },
        });
      }

      return {
        bookingForm: createdBookingForm,
        content: createdContent,
      };
    });

    return NextResponse.json(
      {
        message: "สร้างฟอร์ม + เนื้อหาสำเร็จ",
        bookingForm: result.bookingForm,
        content: result.content,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST booking form + content error:", err);
    return NextResponse.json(
      { error: "สร้างฟอร์มหรือเนื้อหาไม่สำเร็จ" },
      { status: 500 }
    );
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
      return NextResponse.json(
        { error: "กรุณาระบุ id ของฟอร์ม" },
        { status: 400 }
      );
    }

    // Validate คล้าย POST
    if (priceType === "SINGLE" && !singlePrice) {
      return NextResponse.json(
        { error: "PriceType = SINGLE ต้องระบุ singlePrice" },
        { status: 400 }
      );
    }

    if (priceType === "BY_BATCH" && (!batchPrices || batchPrices.length === 0)) {
      return NextResponse.json(
        { error: "PriceType = BY_BATCH ต้องระบุ batchPrices" },
        { status: 400 }
      );
    }

    // UPDATE
    const updated = await prisma.bookingForm.update({
      where: { id },
      data: {
        Type: type || null,
        BatchNumber: batchNumber || null,
        TotalSeats: totalSeats || null,
        StartDate: startDate ? new Date(startDate) : null,
        EndDate: endDate ? new Date(endDate) : null,
        PriceType: priceType,
        singlePrice: priceType === "SINGLE" ? Number(singlePrice) : null,
        batchPrices: priceType === "BY_BATCH" ? batchPrices : null,
        Souvenir: souvenir || null,
      },
    });

    return NextResponse.json(
      { message: "อัปเดตฟอร์มสำเร็จ", bookingForm: updated },
      { status: 200 }
    );
  } catch (err) {
    console.error("PUT booking form error:", err);
    return NextResponse.json(
      { error: "อัปเดตฟอร์มไม่สำเร็จ" },
      { status: 500 }
    );
  }
}
