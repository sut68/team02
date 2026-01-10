import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import jwt from "jsonwebtoken";
import path from "path";
import { promises as fs } from "fs";
import { SUBMISSION_CONFIG, ERROR_MESSAGES } from "@/lib/models/validation"; // ✅ ดึง Config

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production";

function getUserFromToken(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
  } catch (e) {
    return null;
  }
}

// GET
export async function GET(req: NextRequest) {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: ERROR_MESSAGES.UNAUTHORIZED }, { status: 401 });
    }

    const submissions = await prisma.submission.findMany({
      where: { userId: user.userId },
      include: { file: true },
      orderBy: { Date: "desc" },
    });

    return NextResponse.json({ submissions });
  } catch (err) {
    console.error("GET Error:", err);
    return NextResponse.json({ error: ERROR_MESSAGES.DB_ERROR }, { status: 500 });
  }
}

// POST
export async function POST(req: NextRequest) {
  const user = getUserFromToken(req);
  if (!user) {
    return NextResponse.json({ error: ERROR_MESSAGES.UNAUTHORIZED }, { status: 401 });
  }

  let uploadedFilePath: string | null = null; // เอาไว้ลบไฟล์ทิ้งถ้า DB พัง

  try {
    const formData = await req.formData();
    const title = formData.get("title") as string | null;
    const file = formData.get("file") as File | null;

    // 1. Validation: ข้อมูลครบไหม
    if (!title || !title.trim() || !file) {
      return NextResponse.json({ error: ERROR_MESSAGES.MISSING_FIELDS }, { status: 400 });
    }

    // 2. Validation: ประเภทไฟล์ (Check จาก Config)
    if (!SUBMISSION_CONFIG.ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json({ error: ERROR_MESSAGES.INVALID_FILE_TYPE }, { status: 400 });
    }

    // 3. Validation: ขนาดไฟล์
    if (file.size > SUBMISSION_CONFIG.MAX_FILE_SIZE) {
      return NextResponse.json({ error: ERROR_MESSAGES.FILE_TOO_LARGE }, { status: 400 });
    }

    // 4. Save File
    const uploadDir = path.join(process.cwd(), "public", ...SUBMISSION_CONFIG.UPLOAD_DIR.split("/"));
    await fs.mkdir(uploadDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const fileNameOnDisk = `${Date.now()}_${safeName}`;
    const filePathOnDisk = path.join(uploadDir, fileNameOnDisk);
    const publicPath = `/${SUBMISSION_CONFIG.UPLOAD_DIR}/${fileNameOnDisk}`;

    await fs.writeFile(filePathOnDisk, buffer);
    uploadedFilePath = filePathOnDisk; // จำ Path ไว้

    // 5. Save DB (Transaction)
    const submission = await prisma.$transaction(async (tx) => {
      const submissionFile = await tx.submissionFile.create({
        data: { Path: publicPath },
      });

      return await tx.submission.create({
        data: {
          Name: title,
          Date: new Date(),
          status: "PENDING",
          userId: user.userId,
          fileId: submissionFile.id,
        },
        include: { file: true },
      });
    });

    return NextResponse.json({ submission }, { status: 201 });

  } catch (err) {
    console.error("POST Error:", err);
    
    // Cleanup: ลบไฟล์ทิ้งถ้า Error
    if (uploadedFilePath) {
      try { await fs.unlink(uploadedFilePath); } catch (e) { /* ignore */ }
    }

    return NextResponse.json({ error: ERROR_MESSAGES.UPLOAD_FAILED }, { status: 500 });
  }
}