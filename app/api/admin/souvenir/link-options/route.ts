

import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// GET /api/admin/souvenir/link-options
export async function GET() {
  try {
    const allEvents = await prisma.content.findMany({
      where: { categories: { in: ['ACTIVITY', 'NEWS'] } },
      select: {
        id: true,
        TitleName: true,
        souvenirItemId: true,
        souvenirItem: { select: { name: true } },
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    const allProjects = await prisma.donationProject.findMany({
      where: { status: { not: 'CLOSED' } },
      select: {
        id: true,
        title: true,
        souvenirItemId: true,
        souvenirItem: { select: { name: true } },
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });


    return NextResponse.json({
      events: allEvents.map(a => ({
        id: a.id,
        name: a.TitleName ?? '(ไม่มีชื่อ)',
        souvenirItemId: a.souvenirItemId,
        linkedItemName: a.souvenirItem?.name ?? null,
      })),
      donationProjects: allProjects.map(p => ({
        id: p.id,
        name: p.title,
        souvenirItemId: p.souvenirItemId,
        linkedItemName: p.souvenirItem?.name ?? null,
      })),
    });
  } catch (e: any) {
    console.error("❌ API ERROR:", e);
    return NextResponse.json({ error: e.message, events: [], donationProjects: [] }, { status: 500 });
  }
}

