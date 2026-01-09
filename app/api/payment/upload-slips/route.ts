import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ error: "ไม่พบไฟล์ที่อัปโหลด" }, { status: 400 });
    }

    // แปลงไฟล์เป็น Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // กำหนด path ที่จะบันทึก (บันทึกใน folder public เพื่อให้ browser เข้าถึงได้)
    // หมายเหตุ: ใน Vercel/Serverless จะต้องใช้วิธีอื่น (เช่น S3) แต่ถ้า run เองใช้แบบนี้ได้ครับ
    const relativeUploadDir = "/uploads/slips";
    const uploadDir = path.join(process.cwd(), "public", relativeUploadDir);

    // สร้าง folder ถ้ายังไม่มี
    await mkdir(uploadDir, { recursive: true });

    // ตั้งชื่อไฟล์ใหม่ป้องกันชื่อซ้ำ
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const filename = `${uniqueSuffix}${path.extname(file.name)}`;
    const filepath = path.join(uploadDir, filename);

    // บันทึกไฟล์ลงเครื่อง
    await writeFile(filepath, buffer);

    // ส่ง URL กลับไปให้ Frontend
    const fileUrl = `${relativeUploadDir}/${filename}`;
    
    return NextResponse.json({ success: true, url: fileUrl });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการอัปโหลดสลิป" }, { status: 500 });
  }
}