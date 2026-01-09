import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { deleteFromAzureBlob } from "@/lib/azureBlob";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    // 1. Security Check
    const { searchParams } = new URL(req.url);
    if (searchParams.get("key") !== process.env.CRON_SECRET) {
       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 2. ค้นหา Project ที่ถูกลบเกิน 30 วัน
    const projectsToDelete = await prisma.projectProposal.findMany({
      where: { deletedAt: { lt: thirtyDaysAgo } },
      include: {
        summarySubmission: { include: { images: true } }
      }
    });

    // 3. ลบไฟล์ออกจาก Azure (ต้องลบไฟล์ก่อนลบ Data ใน DB)
    const deletionPromises: Promise<void>[] = [];
    
    for (const project of projectsToDelete) {
      if (project.summarySubmission) {
        // ลบไฟล์เอกสาร
        if (project.summarySubmission.summaryFilePath) {
            deletionPromises.push(deleteFromAzureBlob(project.summarySubmission.summaryFilePath));
        }
        // ลบรูปภาพทั้งหมด
        for (const img of project.summarySubmission.images) {
            deletionPromises.push(deleteFromAzureBlob(img.imagePath));
        }
      }
    }
    await Promise.all(deletionPromises); // รอให้ลบไฟล์เสร็จทั้งหมด

    // 4. ลบข้อมูลใน Database
    const projectIds = projectsToDelete.map(p => p.id);
    if (projectIds.length > 0) {
        // ลบ Vote ก่อน
        await prisma.projectVote.deleteMany({
            where: { proposalId: { in: projectIds } }
        });
        // ลบ Project (Report จะหายไปด้วยเพราะ Cascade)
        await prisma.projectProposal.deleteMany({
             where: { id: { in: projectIds } }
        });
    }

    return NextResponse.json({ success: true, deletedCount: projectIds.length });

  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
