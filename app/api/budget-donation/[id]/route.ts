// app/api/budget-donation/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from "@/app/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id); // แปลงเป็นตัวเลข

  const donation = await prisma.budgetDonation.findUnique({
    where: { id: id },
    include: { project: true } // ดึงชื่อโครงการมาด้วย
  });

  if (!donation) {
    return NextResponse.json({ error: 'ไม่พบข้อมูล' }, { status: 404 });
  }

  return NextResponse.json(donation);
}