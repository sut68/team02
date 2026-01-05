import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import path from "path";
import { promises as fs } from "fs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production";

function getUserFromToken(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number; role: string; email: string };
  } catch (e) {
    return null;
  }
}

async function saveFile(file: File, subFolder: string): Promise<string> {
  const uploadDir = path.join(process.cwd(), "public", "uploads", "budget", subFolder);
  await fs.mkdir(uploadDir, { recursive: true });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const safeName = file.name.replace(/\s+/g, "_");
  const fileNameOnDisk = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${safeName}`;
  const filePathOnDisk = path.join(uploadDir, fileNameOnDisk);
  
  await fs.writeFile(filePathOnDisk, buffer);
  return `/uploads/budget/${subFolder}/${fileNameOnDisk}`;
}

// ============================================================================
// GET: ดึงข้อมูลรายงาน
// ============================================================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");
    const year = searchParams.get("year"); // ✅ รับ parameter ปีงบประมาณ
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
    const where: any = {};

    if (showTrash) {
      where.deletedAt = { not: null };
    } else {
      where.deletedAt = null;
    }

    if (projectId) where.proposalId = Number(projectId);
    
    // ✅ เพิ่ม Logic กรองตามสถานะ และ ปีงบประมาณ
    if (status && status !== "ทั้งหมด") {
        where.status = status;
    } else {
        // ถ้าเป็น Public User (ไม่ระบุ status มา) อาจจะอยากเห็นเฉพาะ APPROVED
        // หรือถ้าใน Admin ก็อาจจะส่ง status มา
        // ในที่นี้ถ้าไม่ส่งมา ให้ดึงทั้งหมดที่ไม่ใช่ Draft (สำหรับหน้าบ้าน) หรือตามต้องการ
        // where.status = "APPROVED"; 
    }

    // ✅ กรองตามปีงบประมาณ (Relation: Report -> Proposal -> BudgetRound -> fiscalYear)
    if (year) {
        where.proposal = {
            budgetRound: {
                fiscalYear: year
            }
        };
    }

    const reports = await prisma.summarySubmission.findMany({
      where,
      include: {
        proposal: {
            // Include ข้อมูล Proposal ให้ครบถ้วนเพื่อใช้ใน Type
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

    // ✅ Map ข้อมูลให้ตรงกับ BudgetReport Type และเพิ่ม Helper fields
    const formattedReports = reports.map(r => ({
        ...r, // Spread properties เดิม (id, status, etc.)
        reportTitle: `รายงานสรุปผลโครงการ ${r.proposal?.projectName || ''}`,
        imageSrc: r.images[0]?.imagePath || null, // Helper สำหรับ UI
    }));

    return NextResponse.json({ reports: formattedReports }, { status: 200 });

  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล" }, { status: 500 });
  }
}

// ... (ส่วน POST, PUT, DELETE คงเดิม)
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
    if (evidenceFiles.length > 0 && evidenceFiles[0].size > 0) {
        summaryFilePath = await saveFile(evidenceFiles[0], "evidence");
    }

    const imagePaths: string[] = [];
    for (const file of activityImages) {
        if (file.size > 0) {
            const path = await saveFile(file, "images");
            imagePaths.push(path);
        }
    }

    const newReport = await prisma.summarySubmission.create({
      data: {
        proposalId: Number(projectId),
        totalActualExpense: Number(actualExpense),
        summaryFilePath: summaryFilePath || null,
        status: "DRAFT", // Default status
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
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = getUserFromToken(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const contentType = req.headers.get("content-type") || "";

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

    const formData = await req.formData();
    const id = formData.get("id"); 
    
    const actualExpense = formData.get("actualExpense");
    const newEvidenceFiles = formData.getAll("newEvidenceFiles") as File[];
    const newActivityImages = formData.getAll("newActivityImages") as File[];
    const deletedFileIds = formData.get("deletedFileIds");

    if (!id) return NextResponse.json({ error: "ไม่พบ ID รายงาน" }, { status: 400 });

    const updatePayload: any = {};
    if (actualExpense) updatePayload.totalActualExpense = Number(actualExpense);

    if (newEvidenceFiles.length > 0 && newEvidenceFiles[0].size > 0) {
        const path = await saveFile(newEvidenceFiles[0], "evidence");
        updatePayload.summaryFilePath = path;
    }

    await prisma.$transaction(async (tx) => {
        if (deletedFileIds) {
            const idsToDelete = String(deletedFileIds).split(',').map(Number).filter(n => !isNaN(n));
            if (idsToDelete.length > 0) {
                await tx.submissionImage.deleteMany({
                    where: { id: { in: idsToDelete }, submissionId: Number(id) }
                });
            }
        }

        if (newActivityImages.length > 0) {
            for (const file of newActivityImages) {
                if (file.size > 0) {
                    const path = await saveFile(file, "images");
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