import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import jwt from "jsonwebtoken";
import path from "path";
import { promises as fs } from "fs";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production";

function getUserFromToken(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: number;
      email: string;
      userType: string;
    };
    return decoded;
  } catch (e) {
    return null;
  }
}

// GET /api/submissions – ดึงคำยื่นเรื่องของ user คนนั้น
export async function GET(req: NextRequest) {
  const user = getUserFromToken(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const submissions = await prisma.submission.findMany({
    where: { userId: user.userId },
    include: { file: true },
    orderBy: { Date: "desc" },
  });

  return NextResponse.json({ submissions });
}

// POST /api/submissions – สร้างคำยื่นเรื่องใหม่ + อัปโหลดไฟล์
export async function POST(req: NextRequest) {
  const user = getUserFromToken(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const title = formData.get("title") as string | null;
  const file = formData.get("file") as File | null;

  if (!title || !file) {
    return NextResponse.json(
      { error: "กรุณากรอกชื่อหัวเรื่องและอัปโหลดไฟล์" },
      { status: 400 }
    );
  }

  // ✅ เซฟไฟล์ลง /public/uploads/submissions
  const uploadDir = path.join(process.cwd(), "public", "uploads", "submissions");
  await fs.mkdir(uploadDir, { recursive: true });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const safeName = file.name.replace(/\s+/g, "_");
  const fileNameOnDisk = `${Date.now()}_${safeName}`;
  const filePathOnDisk = path.join(uploadDir, fileNameOnDisk);
  const publicPath = `/submissions/${fileNameOnDisk}`;

  await fs.writeFile(filePathOnDisk, buffer);

  // บันทึกใน SubmissionFile ก่อน
  const submissionFile = await prisma.submissionFile.create({
    data: {
      Path: publicPath,
    },
  });

  // บันทึก Submission
  const submission = await prisma.submission.create({
    data: {
      Name: title,
      Date: new Date(),
      status: "PENDING",
      userId: user.userId,
      fileId: submissionFile.id,
    },
    include: { file: true },
  });

  return NextResponse.json({ submission });
}
