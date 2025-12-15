// app/api/budget-report/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// รองรับ Method GET
export async function GET() {
  try {
    // ดึงข้อมูล SummarySubmission พร้อม relation ที่เกี่ยวข้อง
    const reports = await prisma.summarySubmission.findMany({
      include: {
        images: true,     // รูปภาพประกอบ
        proposal: true,   // ข้อมูลโครงการต้นทาง
        submitter: true,  // ผู้ส่ง (ถ้ามี)
      },
      orderBy: {
        updatedAt: 'desc', // เรียงตามเวลาแก้ไขล่าสุด
      },
    });

    // ส่งข้อมูลกลับไปในรูปแบบ JSON (ต้องส่งเป็น object ที่มี key ตรงกับที่หน้าบ้านรอรับ)
    return NextResponse.json({ reports }); 
  } catch (error) {
    console.error("Error fetching budget reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch budget reports" },
      { status: 500 }
    );
  }
}