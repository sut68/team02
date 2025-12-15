// app/api/budget-report/approved-projects/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // ดึง ProjectProposal ที่มีสถานะ APPROVED
    const projects = await prisma.projectProposal.findMany({
      where: {
        status: "APPROVED",
        // (Optional) กรองเอาเฉพาะอันที่ยังไม่เคยทำรายงานสรุป
        summarySubmissions: {
          none: {}
        }
      },
      orderBy: {
        projectStartDate: 'desc',
      },
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Error fetching approved projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch approved projects" },
      { status: 500 }
    );
  }
}