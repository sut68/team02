import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET() {
  try {
    // ดึงกิจกรรมทั้งหมด
    const events = await prisma.event.findMany({
      select: {
        id: true,
        name: true,
        startDate: true,
        souvenirItemId: true,
      },
      orderBy: {
        startDate: 'desc',
      },
    });

    // ดึงโครงการบริจาคที่ยังเปิดอยู่
    const donationProjects = await prisma.donationProject.findMany({
      where: {
        status: 'OPEN',
      },
      select: {
        id: true,
        title: true,
        goalAmount: true,
        currentAmount: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      events,
      donationProjects,
    });
  } catch (error) {
    console.error('Error fetching link options:', error);
    return NextResponse.json(
      { error: 'Failed to fetch link options' },
      { status: 500 }
    );
  }
}
