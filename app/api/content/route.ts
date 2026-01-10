import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import path from "path";
import { promises as fs } from "fs";
import { ContentCategoryType, Option } from "@prisma/client";
// ✅ Import Config
import { CONTENT_CONFIG, ERROR_MESSAGES } from "@/lib/models/validation";

// Helper (เอาไว้เหมือนเดิม หรือจะย้ายไป utils ก็ได้)
function isNonEmptyString(s: unknown) {
  return typeof s === "string" && s.trim().length > 0;
}

// ============================
// GET
// ============================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const idParam = searchParams.get("id");

    // --- Case 1: Get Single ID ---
    if (idParam !== null) {
      const id = Number(idParam);
      if (!Number.isFinite(id) || id <= 0) {
        return NextResponse.json({ error: ERROR_MESSAGES.ID_INVALID }, { status: 400 });
      }

      const content = await prisma.content.findUnique({
        where: { id },
        include: {
          user: true,
          bookingForm: true,
          pictures: true,
          _count: {
            select: { bookings: { where: { transactionStatus: "SUCCESS" } } },
          },
        },
      });

      if (!content) {
        return NextResponse.json({ error: ERROR_MESSAGES.NOT_FOUND }, { status: 404 });
      }
      return NextResponse.json({ content }, { status: 200 });
    }

    // --- Case 2: Get List ---
    const contents = await prisma.content.findMany({
      where: category ? { categories: category as any } : undefined,
      include: {
        user: true,
        bookingForm: true,
        pictures: true,
        _count: {
          select: { bookings: { where: { transactionStatus: "SUCCESS" } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ contents }, { status: 200 });
  } catch (err) {
    console.error("GET content error:", err);
    return NextResponse.json({ error: ERROR_MESSAGES.DB_ERROR }, { status: 500 });
  }
}

// ============================
// POST
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

    // --- Validation (ใช้ Config) ---
    if (!isNonEmptyString(title)) {
      return NextResponse.json({ error: ERROR_MESSAGES.TITLE_EMPTY }, { status: 400 });
    }
    if (title.length < CONTENT_CONFIG.TITLE_MIN_LENGTH) {
      return NextResponse.json({ error: ERROR_MESSAGES.TITLE_TOO_SHORT }, { status: 400 });
    }
    if (title.length > CONTENT_CONFIG.TITLE_MAX_LENGTH) {
      return NextResponse.json({ error: ERROR_MESSAGES.TITLE_TOO_LONG }, { status: 400 });
    }

    // Categories
    if (!categoriesRaw) {
      return NextResponse.json({ error: ERROR_MESSAGES.CATEGORY_REQUIRED }, { status: 400 });
    }
    if (!Object.values(ContentCategoryType).includes(categoriesRaw as ContentCategoryType)) {
      return NextResponse.json({ error: ERROR_MESSAGES.CATEGORY_INVALID }, { status: 400 });
    }
    const category = categoriesRaw as ContentCategoryType;

    // Description Length
    if (description.length > CONTENT_CONFIG.DESC_MAX_LENGTH) {
      return NextResponse.json({ error: ERROR_MESSAGES.DESC_TOO_LONG }, { status: 400 });
    }

    // Pictures
    const pictureFiles = formData.getAll("pictures") as File[];
    const validPictureFiles = pictureFiles.filter(
      (f) => f && typeof f !== "string" && typeof (f as any).arrayBuffer === "function"
    );

    if (validPictureFiles.length === 0) {
      return NextResponse.json({ error: ERROR_MESSAGES.PICTURE_REQUIRED }, { status: 400 });
    }

    // Booking Option
    let booking: Option | null = null;
    if (bookingRaw) {
      if (!Object.values(Option).includes(bookingRaw as Option)) {
        return NextResponse.json({ error: ERROR_MESSAGES.BOOKING_INVALID }, { status: 400 });
      }
      booking = bookingRaw as Option;
    }

    // IDs Validation
    const userId = userIdRaw ? Number(userIdRaw) : null;
    if (userIdRaw !== null && (!Number.isFinite(userId!) || userId! <= 0)) {
      return NextResponse.json({ error: ERROR_MESSAGES.USER_ID_INVALID }, { status: 400 });
    }

    let bookingFormId: number | null = null;
    if (bookingFormIdRaw !== null && bookingFormIdRaw !== "") {
      const parsed = Number(bookingFormIdRaw);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        return NextResponse.json({ error: ERROR_MESSAGES.FORM_ID_INVALID }, { status: 400 });
      }
      bookingFormId = parsed;
    }

    // --- Save Files ---
    // ใช้ Path จาก Config
    const uploadDir = path.join(process.cwd(), "public", ...CONTENT_CONFIG.UPLOAD_DIR.split("/"));
    await fs.mkdir(uploadDir, { recursive: true });

    const picturePaths: string[] = [];
    for (const file of validPictureFiles) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const fileNameOnDisk = `${Date.now()}_${Math.random().toString(36).slice(2)}_${safeName}`;
      
      const filePathOnDisk = path.join(uploadDir, fileNameOnDisk);
      const publicPath = `/${CONTENT_CONFIG.UPLOAD_DIR}/${fileNameOnDisk}`;

      await fs.writeFile(filePathOnDisk, buffer);
      picturePaths.push(publicPath);
    }

    // --- DB Transaction ---
    const createdContent = await prisma.$transaction(async (tx) => {
      const content = await tx.content.create({
        data: {
          TitleName: title,
          Description: description,
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
      { message: ERROR_MESSAGES.CREATE_SUCCESS, content: createdContent },
      { status: 201 }
    );

  } catch (err) {
    console.error("POST content error:", err);
    return NextResponse.json({ error: ERROR_MESSAGES.DB_ERROR }, { status: 500 });
  }
}

// ============================
// DELETE
// ============================
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const idParam = searchParams.get("id");
    const id = idParam ? Number(idParam) : NaN;

    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: ERROR_MESSAGES.DELETE_ID_REQUIRED }, { status: 400 });
    }

    // (Optional) ถ้าอยากลบรูปจริงด้วย ให้ Find ก่อน Delete แบบ submission

    await prisma.content.delete({ where: { id } });
    return NextResponse.json({ message: ERROR_MESSAGES.DELETE_SUCCESS }, { status: 200 });
  } catch (err) {
    console.error("DELETE content error:", err);
    return NextResponse.json({ error: ERROR_MESSAGES.DB_ERROR }, { status: 500 });
  }
}