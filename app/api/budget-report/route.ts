import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import path from "path";
import { promises as fs } from "fs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production";

// --- Helper: แกะ User จาก Token ---
function getUserFromToken(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number; role: string; email: string };
  } catch (e) {
    return null;
  }
}

// --- Helper: บันทึกไฟล์ลง Server ---
async function saveFile(file: File, subFolder: string): Promise<string> {
  // กำหนด Path: public/uploads/budget/[subFolder]
  const uploadDir = path.join(process.cwd(), "public", "uploads", "budget", subFolder);
  
  // สร้างโฟลเดอร์ถ้ายังไม่มี
  await fs.mkdir(uploadDir, { recursive: true });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // สร้างชื่อไฟล์ไม่ซ้ำ: timestamp_random_originalName (clean spaces)
  const safeName = file.name.replace(/\s+/g, "_");
  const fileNameOnDisk = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${safeName}`;
  const filePathOnDisk = path.join(uploadDir, fileNameOnDisk);
  
  await fs.writeFile(filePathOnDisk, buffer);
  
  // คืนค่า Path สำหรับเก็บใน DB (เริ่มจาก /uploads/...)
  return `/uploads/budget/${subFolder}/${fileNameOnDisk}`;
}

// ============================================================================
// GET: ดึงข้อมูลรายงาน (ทั้งหมด หรือ ตาม ID/Filter)
// ============================================================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");

    // 1. กรณีดึงรายการเดียว (Detail)
    if (id) {
      const report = await prisma.summarySubmission.findUnique({
        where: { id: Number(id) },
        include: {
          proposal: {
            include: { manager: true }
          },
          images: true,
          submitter: { select: { id: true, fullName: true, email: true } },
        },
      });

      if (!report) {
        return NextResponse.json({ error: "ไม่พบรายงาน" }, { status: 404 });
      }
      return NextResponse.json({ report }, { status: 200 });
    }

    // 2. กรณีดึงเป็น List (พร้อม Filter)
    const where: any = { deletedAt: null }; // กรองเฉพาะที่ยังไม่ถูกลบ

    if (projectId) where.proposalId = Number(projectId);
    if (status && status !== "ทั้งหมด") where.status = status;

    const reports = await prisma.summarySubmission.findMany({
      where,
      include: {
        proposal: {
            select: { id: true, projectName: true, responsibilityUnit: true }
        },
        images: {
            take: 1 // เอาแค่รูปแรกไปแสดงเป็นปกในการ์ด
        },
        submitter: { select: { fullName: true } }
      },
      orderBy: { updatedAt: "desc" },
    });

    // Transform ข้อมูลเพื่อให้ Frontend แสดงผลได้ง่าย (Flatten Data)
    const formattedReports = reports.map(r => ({
        id: r.id,
        projectName: r.proposal?.projectName || "ไม่ระบุโครงการ",
        reportTitle: `รายงานสรุปโครงการ ${r.proposal?.projectName}`,
        status: r.status,
        updatedAt: r.updatedAt,
        createdAt: r.createdAt,
        imageSrc: r.images[0]?.imagePath || null, // รูปปก
        totalExpense: r.totalActualExpense,
        unit: r.proposal?.responsibilityUnit
    }));

    return NextResponse.json({ reports: formattedReports }, { status: 200 });

  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล" }, { status: 500 });
  }
}

// ============================================================================
// POST: สร้างรายงานใหม่ (รองรับ FormData Upload)
// ============================================================================
export async function POST(req: NextRequest) {
  try {
    // 1. ตรวจสอบสิทธิ์
    const user = getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    const formData = await req.formData();
    
    // 2. ดึงข้อมูลจาก Form
    const projectId = formData.get("projectId") as string;
    const actualExpense = formData.get("actualExpense") as string;
    
    // ไฟล์: รับมาเป็น array
    const evidenceFiles = formData.getAll("evidenceFiles") as File[]; 
    const activityImages = formData.getAll("activityImages") as File[];

    if (!projectId || !actualExpense) {
      return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน (Project ID, Expense)" }, { status: 400 });
    }

    // 3. Upload ไฟล์หลักฐาน (Evidence) -> เก็บ Path ใน summaryFilePath
    // (สมมติว่าเก็บไฟล์แรกเป็นหลัก หรือจะปรับให้เก็บหลายไฟล์ก็ได้ตาม DB schema)
    let summaryFilePath = "";
    if (evidenceFiles.length > 0 && evidenceFiles[0].size > 0) {
        summaryFilePath = await saveFile(evidenceFiles[0], "evidence");
    }

    // 4. Upload รูปภาพกิจกรรม (Images) -> เตรียมข้อมูลเพื่อ insert ลงตารางลูก
    const imagePaths: string[] = [];
    for (const file of activityImages) {
        if (file.size > 0) {
            const path = await saveFile(file, "images");
            imagePaths.push(path);
        }
    }

    // 5. บันทึกลงฐานข้อมูล
    const newReport = await prisma.summarySubmission.create({
      data: {
        proposalId: Number(projectId),
        totalActualExpense: Number(actualExpense),
        summaryFilePath: summaryFilePath || null,
        status: "DRAFT", // เริ่มต้นเป็น Draft
        submitterId: user.userId,
        submissionDate: new Date(),
        
        // สร้าง Relations รูปภาพในตาราง SubmissionImage (ถ้ามี)
        images: {
            create: imagePaths.map(path => ({
                imagePath: path
            }))
        }
      },
      include: { images: true }
    });

    return NextResponse.json({ message: "บันทึกรายงานสำเร็จ", report: newReport }, { status: 201 });

  } catch (error) {
    console.error("POST Error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" }, { status: 500 });
  }
}

// ============================================================================
// PUT: แก้ไขรายงาน (รองรับ JSON สำหรับเปลี่ยนสถานะ และ FormData สำหรับแก้เนื้อหา)
// ============================================================================
export async function PUT(req: NextRequest) {
  try {
    const user = getUserFromToken(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const contentType = req.headers.get("content-type") || "";

    // --- กรณี 1: ส่ง JSON (เช่น เปลี่ยนสถานะจากหน้าการ์ด) ---
    if (contentType.includes("application/json")) {
        const body = await req.json();
        const { id, status, ...updateData } = body;

        if (!id) return NextResponse.json({ error: "ไม่พบ ID" }, { status: 400 });

        const updated = await prisma.summarySubmission.update({
            where: { id: Number(id) },
            data: {
                status: status, 
                ...updateData
            }
        });
        return NextResponse.json({ message: "อัปเดตสถานะสำเร็จ", report: updated });
    }

    // --- กรณี 2: ส่ง FormData (แก้ไขข้อมูล + อัปโหลดไฟล์ใหม่จากหน้า Edit) ---
    const formData = await req.formData();
    const id = formData.get("projectId") || formData.get("id"); // รับ ID รายงาน
    const actualExpense = formData.get("actualExpense");
    
    // ไฟล์ใหม่ที่อัปโหลดเพิ่ม
    const newEvidenceFiles = formData.getAll("newEvidenceFiles") as File[];
    const newActivityImages = formData.getAll("newActivityImages") as File[];
    
    // รายการ ID ของรูป/ไฟล์เดิมที่ต้องการลบ (Client ส่งมาเป็น "1,2,3")
    const deletedFileIds = formData.get("deletedFileIds");

    if (!id) return NextResponse.json({ error: "ไม่พบ ID รายงาน" }, { status: 400 });

    // เตรียมข้อมูล Update
    const updatePayload: any = {};
    if (actualExpense) updatePayload.totalActualExpense = Number(actualExpense);

    // จัดการไฟล์ Evidence ใหม่ (ถ้ามี) -> ทับของเดิมใน summaryFilePath
    if (newEvidenceFiles.length > 0 && newEvidenceFiles[0].size > 0) {
        const path = await saveFile(newEvidenceFiles[0], "evidence");
        updatePayload.summaryFilePath = path;
    }

    // ทำ Transaction เพื่อความถูกต้องของข้อมูลสัมพันธ์
    await prisma.$transaction(async (tx) => {
        
        // 1. ลบรูปเดิมที่ถูก user สั่งลบ
        if (deletedFileIds) {
            const idsToDelete = String(deletedFileIds).split(',').map(Number).filter(n => !isNaN(n));
            if (idsToDelete.length > 0) {
                // ลบจาก DB (ไฟล์จริงอาจจะเก็บไว้หรือลบก็ได้ตาม Policy)
                await tx.submissionImage.deleteMany({
                    where: { 
                        id: { in: idsToDelete },
                        submissionId: Number(id)
                    }
                });
            }
        }

        // 2. เพิ่มรูปใหม่ลงใน SubmissionImage
        if (newActivityImages.length > 0) {
            for (const file of newActivityImages) {
                if (file.size > 0) {
                    const path = await saveFile(file, "images");
                    await tx.submissionImage.create({
                        data: {
                            submissionId: Number(id),
                            imagePath: path
                        }
                    });
                }
            }
        }

        // 3. อัปเดตข้อมูลหลัก (Expense, Evidence Path)
        await tx.summarySubmission.update({
            where: { id: Number(id) },
            data: updatePayload
        });
    });

    return NextResponse.json({ message: "แก้ไขข้อมูลสำเร็จ" }, { status: 200 });

  } catch (error) {
    console.error("PUT Error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการแก้ไขข้อมูล" }, { status: 500 });
  }
}

// ============================================================================
// DELETE: ลบรายงาน (Soft Delete)
// ============================================================================
export async function DELETE(req: NextRequest) {
  try {
    const user = getUserFromToken(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ไม่พบ ID" }, { status: 400 });

    // ใช้ Soft Delete (ใส่ deletedAt) ตาม Schema
    await prisma.summarySubmission.update({
        where: { id: Number(id) },
        data: { deletedAt: new Date() }
    });

    return NextResponse.json({ message: "ลบรายการสำเร็จ" }, { status: 200 });

  } catch (error) {
    console.error("DELETE Error:", error);
    return NextResponse.json({ error: "ลบรายการไม่สำเร็จ" }, { status: 500 });
  }
}