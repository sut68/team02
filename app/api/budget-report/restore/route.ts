// app/api/budget-report/restore/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id } = body;

    const restoredReport = await prisma.summarySubmission.update({
      where: { id: Number(id) },
      data: { 
        deletedAt: null,
        status: "DRAFT" // รีเซ็ตสถานะกลับเป็นแบบร่าง
      } 
    });

    return NextResponse.json(restoredReport);
  } catch (error) {
    console.error("Restore Error:", error);
    return NextResponse.json({ error: "Restore failed" }, { status: 500 });
  }
}