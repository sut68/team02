import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import path from "path";
import { promises as fs } from "fs";
import { ContentCategoryType, Option } from "@prisma/client"; 

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
//      (แก้ให้เหมือน submission + handle enum)
// ============================
export async function POST(req: NextRequest) {
  try {
    // ✅ เปลี่ยนจาก req.json() → formData() เพื่อรับไฟล์จริง
    const formData = await req.formData();
    const title = (formData.get("title") as string) || "";
    const description = (formData.get("description") as string) || "";
    const categoriesRaw = formData.get("categories") as string | null;
    const bookingRaw = formData.get("booking") as string | null;
    const userIdRaw = formData.get("userId") as string | null;
    const bookingFormIdRaw = formData.get("bookingFormId") as string | null;

    const userId = userIdRaw ? Number(userIdRaw) : null;
    const bookingFormId = bookingFormIdRaw ? Number(bookingFormIdRaw) : null;

    if (!categoriesRaw) {
      return NextResponse.json(
        { error: "ต้องระบุ categories" },
        { status: 400 }
      );
    }

    // ✅ แปลง string → enum ContentCategoryType
    let category: ContentCategoryType | null = null;
    if (Object.values(ContentCategoryType).includes(categoriesRaw as ContentCategoryType)) {
      category = categoriesRaw as ContentCategoryType;
    } else {
      return NextResponse.json(
        { error: "categories ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    // ✅ แปลง string → enum Option (HAVE / NOT) หรือ null
    let booking: Option | null = null;
    if (bookingRaw && Object.values(Option).includes(bookingRaw as Option)) {
      booking = bookingRaw as Option;
    }

    // ✅ รับไฟล์รูปหลายไฟล์จาก field ชื่อ "pictures"
    const pictureFiles = formData.getAll("pictures") as File[];

    // ✅ เซฟไฟล์ลง /public/uploads/contents เหมือน submission
    const uploadDir = path.join(process.cwd(), "public", "uploads", "content");
    await fs.mkdir(uploadDir, { recursive: true });

    const picturePaths: string[] = [];

    for (const file of pictureFiles) {
      // กันเผื่อมีค่าอื่นปนมา
      if (!file || typeof file === "string") continue;

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const safeName = file.name.replace(/\s+/g, "_");
      const fileNameOnDisk = `${Date.now()}_${Math.random()
        .toString(36)
        .slice(2)}_${safeName}`;
      const filePathOnDisk = path.join(uploadDir, fileNameOnDisk);
      const publicPath = `/uploads/content/${fileNameOnDisk}`;

      await fs.writeFile(filePathOnDisk, buffer);
      picturePaths.push(publicPath);
    }

    // ✅ ใช้ transaction เดิม แต่เปลี่ยนมาจาก picturePaths ที่เซฟจริงแล้ว
    const createdContent = await prisma.$transaction(async (tx) => {
      const content = await tx.content.create({
        data: {
          TitleName: title || "", 
          Description: description || "",
          categories: category,
          Booking: booking,
          Userid: userId || null,
          BookingFormID: bookingFormId || null,
        },
      });

      // ถ้ามีรูป → สร้าง PictureContent หลายรายการ
      if (picturePaths && picturePaths.length > 0) {
        await tx.pictureContent.createMany({
          data: picturePaths.map((p: string) => ({
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
      title,
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
