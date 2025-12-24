// app/api/content/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import path from "path";
import { promises as fs } from "fs";
import { ContentCategoryType, Option } from "@prisma/client";

function isNonEmptyString(s: unknown) {
  return typeof s === "string" && s.trim().length > 0;
}

function tooLong(s: string, max: number) {
  return s.length > max;
}

// ============================
// GET - list หรือ 1 อันด้วย id
// ============================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const idParam = searchParams.get("id");

    // ถ้ามี id param แต่แปลงเป็นเลขไม่ได้ -> 400 (เพิ่ม validation)
    if (idParam !== null) {
      const id = Number(idParam);
      if (!Number.isFinite(id) || id <= 0) {
        return NextResponse.json({ error: "id ไม่ถูกต้อง" }, { status: 400 });
      }

      const content = await prisma.content.findUnique({
        where: { id },
        include: {
          user: true,
          bookingForm: true,
          pictures: true,
        },
      });

      if (!content) {
        return NextResponse.json({ error: "ไม่พบเนื้อหา" }, { status: 404 });
      }
      return NextResponse.json({ content }, { status: 200 });
    }

    const contents = await prisma.content.findMany({
      where: category ? { categories: category as any } : undefined,
      include: {
        user: true,
        bookingForm: true,
        pictures: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ contents }, { status: 200 });
  } catch (err) {
    console.error("GET content error:", err);
    return NextResponse.json({ error: "ดึงข้อมูลเนื้อหาไม่สำเร็จ" }, { status: 500 });
  }
}

// ============================
// POST - สร้าง Content + รูปหลายรูป
// ============================
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const titleRaw = formData.get("title");
    const descriptionRaw = formData.get("description");
    const categoriesRaw = formData.get("categories") as string | null;
    const bookingRaw = formData.get("booking") as string | null;

    const userIdRaw = formData.get("userId") as string | null;
    const bookingFormIdRaw = formData.get("bookingFormId") as string | null;

    const title = typeof titleRaw === "string" ? titleRaw.trim() : "";
    const description = typeof descriptionRaw === "string" ? descriptionRaw : "";

    // --- Validation ---
    if (!isNonEmptyString(title)) {
      return NextResponse.json({ error: "ชื่อหัวเรื่องห้ามว่าง" }, { status: 400 });
    }
    if (title.length < 3) {
      return NextResponse.json({ error: "ชื่อหัวเรื่องสั้นเกินไป" }, { status: 400 });
    }
    if (tooLong(title, 200)) {
      return NextResponse.json({ error: "ชื่อหัวเรื่องยาวเกินไป" }, { status: 400 });
    }
    if (!categoriesRaw) {
      return NextResponse.json({ error: "ต้องระบุ categories" }, { status: 400 });
    }

    if (!Object.values(ContentCategoryType).includes(categoriesRaw as ContentCategoryType)) {
      return NextResponse.json({ error: "categories ไม่ถูกต้อง" }, { status: 400 });
    }
    const category = categoriesRaw as ContentCategoryType;

    // Description length check: if provided and too long -> fail early
    if (typeof descriptionRaw === "string" && tooLong(descriptionRaw, 1000)) {
      return NextResponse.json({ error: "รายละเอียดต้องไม่เกิน 1000 ตัวอักษร" }, { status: 400 });
    }

    // Picture validation: ต้องมีรูปอย่างน้อย 1 รูป ก่อนสร้าง
    const pictureFiles = formData.getAll("pictures") as File[];
    const validPictureFiles = pictureFiles.filter(
      (f) =>
        f &&
        typeof f !== "string" &&
        // support Node-side fake files used in tests (they expose arrayBuffer)
        typeof (f as any).arrayBuffer === "function"
    );

    if (validPictureFiles.length === 0) {
      return NextResponse.json({ error: "ต้องอัปโหลดรูปอย่างน้อย 1 รูป" }, { status: 400 });
    }

    let booking: Option | null = null;
    if (bookingRaw) {
      if (!Object.values(Option).includes(bookingRaw as Option)) {
        return NextResponse.json({ error: "booking ไม่ถูกต้อง" }, { status: 400 });
      }
      booking = bookingRaw as Option;
    }

    const userId = userIdRaw ? Number(userIdRaw) : null;
    if (userIdRaw !== null && (!Number.isFinite(userId!) || userId! <= 0)) {
      return NextResponse.json({ error: "userId ไม่ถูกต้อง" }, { status: 400 });
    }

    let bookingFormId: number | null = null;

if (bookingFormIdRaw !== null && bookingFormIdRaw !== "") {
  const parsed = Number(bookingFormIdRaw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return NextResponse.json({ error: "bookingFormId ไม่ถูกต้อง" }, { status: 400 });
  }
  bookingFormId = parsed;
}


    const uploadDir = path.join(process.cwd(), "public", "uploads", "content");
    await fs.mkdir(uploadDir, { recursive: true });

    const picturePaths: string[] = [];
    for (const file of validPictureFiles) {
      if (!file || typeof file === "string") continue;
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const safeName = file.name.replace(/\s+/g, "_");
      const fileNameOnDisk = `${Date.now()}_${Math.random().toString(36).slice(2)}_${safeName}`;
      const filePathOnDisk = path.join(uploadDir, fileNameOnDisk);
      const publicPath = `/uploads/content/${fileNameOnDisk}`;

      await fs.writeFile(filePathOnDisk, buffer);
      picturePaths.push(publicPath);
    }

    const createdContent = await prisma.$transaction(async (tx) => {
      const content = await tx.content.create({
        data: {
          TitleName: title, 
          Description: description || "",
          categories: category,
          Booking: booking,
          Userid: userId,
          BookingFormID: bookingFormId,
        },
      });

      if (picturePaths.length > 0) {
        await tx.pictureContent.createMany({
          data: picturePaths.map((p) => ({ Path: p, ContentID: content.id })),
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
    return NextResponse.json({ error: "สร้างเนื้อหาไม่สำเร็จ" }, { status: 500 });
  }
}

// DELETE เหมือนเดิม (แต่อยากให้เหมือนเพื่อน: validate id)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const idParam = searchParams.get("id");
    const id = idParam ? Number(idParam) : NaN;

    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "ต้องระบุ id สำหรับลบ" }, { status: 400 });
    }

    await prisma.content.delete({ where: { id } });
    return NextResponse.json({ message: "ลบเนื้อหาสำเร็จ" }, { status: 200 });
  } catch (err) {
    console.error("DELETE content error:", err);
    return NextResponse.json({ error: "ลบเนื้อหาไม่สำเร็จ" }, { status: 500 });
  }
}
