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

    // 2. ค้นหา Report ที่ถูกลบ (เฉพาะที่ลบแบบเดี่ยวๆ ไม่รวมที่ติดกับ Project)
    const reportsToDelete = await prisma.summarySubmission.findMany({
      where: { deletedAt: { lt: thirtyDaysAgo } },
      include: { images: true }
    });

    // 3. ลบไฟล์ออกจาก Azure
    const deletionPromises: Promise<void>[] = [];

    for (const report of reportsToDelete) {
        if (report.summaryFilePath) {
            deletionPromises.push(deleteFromAzureBlob(report.summaryFilePath));
        }
        for (const img of report.images) {
            deletionPromises.push(deleteFromAzureBlob(img.imagePath));
        }
    }
    await Promise.all(deletionPromises);

    // 4. ลบข้อมูลใน Database
    const deletedReports = await prisma.summarySubmission.deleteMany({
      where: { deletedAt: { lt: thirtyDaysAgo } },
    });

    return NextResponse.json({ success: true, deletedCount: deletedReports.count });

  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}