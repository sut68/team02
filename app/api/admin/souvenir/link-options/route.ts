

import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// GET /api/admin/souvenir/link-options
export async function GET() {
  try {
    const activities = await prisma.content.findMany({
      where: { categories: 'ACTIVITY' },
      select: {
        id: true,
        TitleName: true,
        createdAt: true,
        souvenirItemId: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const donationProjects = await prisma.donationProject.findMany({
      select: {
        id: true,
        title: true,
        currentAmount: true,
        goalAmount: true,
        status: true,
      },
      orderBy: { id: 'desc' },
      // where: { status: 'OPEN' }, // Uncomment to filter only open projects
    });

    return NextResponse.json({
      events: activities.map(a => ({
        id: a.id,
        name: a.TitleName ?? '(ไม่มีชื่อกิจกรรม)',
        startDate: a.createdAt,
        souvenirItemId: a.souvenirItemId ?? null,
      })),
      donationProjects,
    }, { status: 200 });
  } catch (e) {
    console.error('link-options error:', e);
    return NextResponse.json({ events: [], donationProjects: [] }, { status: 500 });
  }
}
