import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

// ============================
// GET - ดึงรายการ Content ทั้งหมด
// ============================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    const contents = await prisma.content.findMany({
      where: category
        ? { categories: category as any }
        : undefined,
      include: {
        user: true,
        bookingForm: true,
        pictures: true,
        bookings: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ contents }, { status: 200 });
  } catch (err) {
    console.error("GET content error:", err);
    return NextResponse.json(
      { error: "ดึงข้อมูลเนื้อหาไม่สำเร็จ" },
      { status: 500 }
    );
  }
}

// ============================
// POST - สร้าง Content + PictureContent หลายรูป
// ============================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      description,
      categories,
      booking,
      userId,
      bookingFormId,
      pictures, // array ของ path
    } = body;

    if (!categories) {
      return NextResponse.json(
        { error: "ต้องระบุ categories" },
        { status: 400 }
      );
    }

    // transaction ปลอดภัยกว่า
    const createdContent = await prisma.$transaction(async (tx) => {
      const content = await tx.content.create({
        data: {
          Description: description || "",
          categories: categories,
          Booking: booking || null,
          Userid: userId || null,
          BookingFormID: bookingFormId || null,
        },
      });

      // ถ้ามีรูป → สร้าง PictureContent หลายรายการ
      if (pictures && pictures.length > 0) {
        await tx.pictureContent.createMany({
          data: pictures.map((p: string) => ({
            Path: p,
            ContentID: content.id,
          })),
        });
      }

      return await tx.content.findUnique({
        where: { id: content.id },
        include: { pictures: true },
      });
    });

    return NextResponse.json(
      { message: "สร้างเนื้อหาสำเร็จ", content: createdContent },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST content error:", err);
    return NextResponse.json(
      { error: "สร้างเนื้อหาไม่สำเร็จ" },
      { status: 500 }
    );
  }
}

// ============================
// PUT - อัปเดต Content + รูปทั้งหมด
// ============================
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      description,
      categories,
      booking,
      userId,
      bookingFormId,
      pictures, // array ของ path ใหม่
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ต้องระบุ id สำหรับอัปเดต" },
        { status: 400 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      // update content
      const content = await tx.content.update({
        where: { id },
        data: {
          Description: description || "",
          categories: categories || undefined,
          Booking: booking || undefined,
          Userid: userId || undefined,
          BookingFormID: bookingFormId || undefined,
        },
      });

      // ลบรูปเก่าทั้งหมด + เพิ่มรูปใหม่
      if (pictures) {
        await tx.pictureContent.deleteMany({
          where: { ContentID: id },
        });

        if (pictures.length > 0) {
          await tx.pictureContent.createMany({
            data: pictures.map((p: string) => ({
              Path: p,
              ContentID: id,
            })),
          });
        }
      }

      return await tx.content.findUnique({
        where: { id },
        include: { pictures: true },
      });
    });

    return NextResponse.json(
      { message: "อัปเดตเนื้อหาสำเร็จ", content: updated },
      { status: 200 }
    );
  } catch (err) {
    console.error("PUT content error:", err);
    return NextResponse.json(
      { error: "อัปเดตเนื้อหาไม่สำเร็จ" },
      { status: 500 }
    );
  }
}

// ============================
// DELETE - ลบ Content + PictureContent
// ============================
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));

    if (!id) {
      return NextResponse.json(
        { error: "ต้องระบุ id สำหรับลบ" },
        { status: 400 }
      );
    }

    // PictureContent จะถูกลบตามเพราะ onDelete: Cascade
    await prisma.content.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "ลบเนื้อหาสำเร็จ" },
      { status: 200 }
    );
  } catch (err) {
    console.error("DELETE content error:", err);
    return NextResponse.json(
      { error: "ลบเนื้อหาไม่สำเร็จ" },
      { status: 500 }
    );
  }
}
