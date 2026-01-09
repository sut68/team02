import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import { uploadToAzureBlob } from '@/lib/azureBlob'; 

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production";

// ฟังก์ชันแกะ User จาก Token
function getUserFromToken(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number; role: string; email: string };
  } catch (e) {
    return null;
  }
}

// 2. ฟังก์ชันช่วยอัปโหลดไป Cloud (ใช้ Azure Blob Storage)
async function saveFileToCloud(file: File, subFolder: string): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // ตั้งชื่อไฟล์ (Key) ที่จะเก็บใน Cloud
  const safeName = file.name.replace(/\s+/g, "_");
  // ตัวอย่าง Path: uploads/budget/evidence/1709999_filename.pdf
  const cloudPath = `uploads/budget/${subFolder}/${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${safeName}`;

  // ส่งไป Azure (Return เป็น URL เต็มๆ กลับมา)
  return await uploadToAzureBlob(buffer, cloudPath, file.type);
}

// GET: ดึงข้อมูลรายงาน (ส่วนนี้เหมือนเดิม 100%)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");
    const year = searchParams.get("year"); 
    const roundId = searchParams.get("roundId");
    const showTrash = searchParams.get("trash") === "true"; 

    // 1. กรณีดึงรายการเดียว (Detail)
    if (id) {
      const report = await prisma.summarySubmission.findUnique({
        where: { id: Number(id) },
        include: {
          proposal: { include: { manager: true } },
          images: true,
          submitter: { select: { id: true, fullName: true, email: true } },
        },
      });

      if (!report) {
        return NextResponse.json({ error: "ไม่พบรายงาน" }, { status: 404 });
      }
      return NextResponse.json({ report }, { status: 200 });
    }

    // 2. กรณีดึงเป็น List
    const where: Prisma.SummarySubmissionWhereInput = {};

    if (showTrash) where.deletedAt = { not: null };
    else where.deletedAt = null;

    if (projectId) where.proposalId = Number(projectId);
    
    if (status && status !== "ทั้งหมด") where.status = status as any;

    if (year || (roundId && roundId !== "all")) {
        where.proposal = {
            budgetRound: {
                ...(year && { fiscalYear: year }),
                ...(roundId && roundId !== "all" && { id: Number(roundId) })
            }
        };
    }

    const reports = await prisma.summarySubmission.findMany({
      where,
      include: {
        proposal: {
            include: {
                budgetRound: true,
                manager: true
            }
        },
        images: true,
        submitter: { select: { id: true, fullName: true, email: true } }
      },
      orderBy: { updatedAt: "desc" },
    });

    const formattedReports = reports.map(r => ({
        ...r, 
        reportTitle: `รายงานสรุปผล ${r.proposal?.projectName || ''}`,
        imageSrc: r.images[0]?.imagePath || null, 
    }));

    return NextResponse.json({ reports: formattedReports }, { status: 200 });

  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล" }, { status: 500 });
  }
}

// ============================================================================
// POST: สร้างรายงานใหม่ (แก้ไขให้ใช้ saveFileToCloud)
// ============================================================================
export async function POST(req: NextRequest) {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    const formData = await req.formData();
    const projectId = formData.get("projectId") as string;
    const actualExpense = formData.get("actualExpense") as string;
    const evidenceFiles = formData.getAll("evidenceFiles") as File[]; 
    const activityImages = formData.getAll("activityImages") as File[];

    if (!projectId || !actualExpense) {
      return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน (Project ID, Expense)" }, { status: 400 });
    }

    let summaryFilePath = "";
    // 3. เรียกใช้ฟังก์ชัน Cloud สำหรับไฟล์หลัก
    if (evidenceFiles.length > 0 && evidenceFiles[0].size > 0) {
        summaryFilePath = await saveFileToCloud(evidenceFiles[0], "evidence");
    }

    const imagePaths: string[] = [];
    // 4. เรียกใช้ฟังก์ชัน Cloud สำหรับรูปภาพกิจกรรม
    for (const file of activityImages) {
        if (file.size > 0) {
            const path = await saveFileToCloud(file, "images");
            imagePaths.push(path);
        }
    }

    const newReport = await prisma.summarySubmission.create({
      data: {
        proposalId: Number(projectId),
        totalActualExpense: Number(actualExpense),
        summaryFilePath: summaryFilePath || null,
        status: "DRAFT", 
        submitterId: user.userId,
        submissionDate: new Date(),
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
    return NextResponse.json({ 
        error: "เกิดข้อผิดพลาดในการบันทึกข้อมูล", 
        details: (error as Error).message 
    }, { status: 500 });
  }
}

// ============================================================================
// PUT: แก้ไขข้อมูล (แก้ไขให้ใช้ saveFileToCloud)
// ============================================================================
export async function PUT(req: NextRequest) {
  try {
    const user = getUserFromToken(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const contentType = req.headers.get("content-type") || "";

    // กรณีส่ง JSON (เช่น อัปเดตสถานะอย่างเดียว)
    if (contentType.includes("application/json")) {
        const body = await req.json();
        const { id, status, ...updateData } = body;

        if (!id) return NextResponse.json({ error: "ไม่พบ ID" }, { status: 400 });

        const updated = await prisma.summarySubmission.update({
            where: { id: Number(id) },
            data: { status: status, ...updateData }
        });
        return NextResponse.json({ message: "อัปเดตสถานะสำเร็จ", report: updated });
    }

    // กรณีส่ง FormData (มีการอัปโหลดไฟล์)
    const formData = await req.formData();
    const id = formData.get("id"); 
    
    const actualExpense = formData.get("actualExpense");
    const newEvidenceFiles = formData.getAll("newEvidenceFiles") as File[];
    const newActivityImages = formData.getAll("newActivityImages") as File[];
    const deletedFileIds = formData.get("deletedFileIds");

    if (!id) return NextResponse.json({ error: "ไม่พบ ID รายงาน" }, { status: 400 });

    const updatePayload: any = {};
    if (actualExpense) updatePayload.totalActualExpense = Number(actualExpense);

    // 5. อัปโหลดไฟล์หลักใหม่ (ถ้ามี)
    if (newEvidenceFiles.length > 0 && newEvidenceFiles[0].size > 0) {
        const path = await saveFileToCloud(newEvidenceFiles[0], "evidence");
        updatePayload.summaryFilePath = path;
    }

    await prisma.$transaction(async (tx) => {
        // ลบรูปภาพเดิม (ลบเฉพาะใน DB)
        if (deletedFileIds) {
            const idsToDelete = String(deletedFileIds).split(',').map(Number).filter(n => !isNaN(n));
            if (idsToDelete.length > 0) {
                await tx.submissionImage.deleteMany({
                    where: { id: { in: idsToDelete }, submissionId: Number(id) }
                });
            }
        }

        // 6. เพิ่มรูปภาพใหม่ (ถ้ามี)
        if (newActivityImages.length > 0) {
            for (const file of newActivityImages) {
                if (file.size > 0) {
                    const path = await saveFileToCloud(file, "images");
                    await tx.submissionImage.create({
                        data: { submissionId: Number(id), imagePath: path }
                    });
                }
            }
        }

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

// DELETE: ย้ายลงถังขยะ (Soft Delete)
export async function DELETE(req: NextRequest) {
  try {
    const user = getUserFromToken(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ไม่พบ ID" }, { status: 400 });
    await prisma.summarySubmission.update({
        where: { id: Number(id) },
        data: { deletedAt: new Date() }
    });
    return NextResponse.json({ message: "ย้ายลงถังขยะสำเร็จ" }, { status: 200 });
  } catch (error) {
    console.error("DELETE Error:", error);
    return NextResponse.json({ error: "ลบรายการไม่สำเร็จ" }, { status: 500 });
  }
}