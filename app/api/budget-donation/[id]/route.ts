// app/api/budget-donation/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/app/lib/prisma";

export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; 
    
    const donationId = Number(id); 

    if (isNaN(donationId)) {
      return NextResponse.json({ error: 'ID รูปแบบไม่ถูกต้อง' }, { status: 400 });
    }

    const donation = await prisma.budgetDonation.findUnique({
      where: { id: donationId }, 
      include: { project: true }
    });

    if (!donation) {
      return NextResponse.json({ error: 'ไม่พบข้อมูล' }, { status: 404 });
    }

    return NextResponse.json(donation);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}