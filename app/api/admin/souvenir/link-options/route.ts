
import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// GET /api/admin/souvenir/link-options
export async function GET() {
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

  return NextResponse.json({
    events: activities.map(a => ({
      id: a.id,
      name: a.TitleName ?? '(ไม่มีชื่อกิจกรรม)',
      startDate: a.createdAt,
      souvenirItemId: a.souvenirItemId ?? null,
    }))
  });
}
