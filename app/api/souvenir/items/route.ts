import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// GET - ดึงรายการของที่ระลึกสำหรับ user (เฉพาะที่ active)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const items = await prisma.souvenirItem.findMany({
      where: {
        active: true,
        ...(category && { category }),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        contents: {
          select: {
            id: true,
            TitleName: true,
            categories: true,
          },
        },
        donationProjects: {
          select: {
            id: true,
            title: true,
          },
        },
        donations: {
          select: {
            id: true,
            userId: true,
            status: true,
            donatedAt: true,
            shipments: {
              select: {
                id: true,
                status: true,
                trackingNo: true,
                shippedAt: true,
                deliveredAt: true,
              },
            },
          },
        },
        _count: {
          select: {
            movements: true,
            entitlements: true,
            redemptions: true,
            shipments: true,
            donations: true,
          },
        },
      },
    });

    // คำนวณสต็อกคงเหลือจริง และแนบ relations ที่ต้องใช้
    const itemsWithStock = await Promise.all(
      items.map(async (item) => {
        const movements = await prisma.stockMovement.findMany({
          where: { itemId: item.id },
        });
        const totalDelta = movements.reduce((sum: number, m) => sum + m.delta, 0);
        const currentStock = item.initialStock + totalDelta;
        // filter เฉพาะ donations ที่ status เป็น completed/success
        const validDonations = item.donations?.filter(d => d.status === 'completed' || d.status === 'success') || [];
        return {
          id: item.id,
          sku: item.sku,
          name: item.name,
          description: item.description,
          category: item.category,
          imageUrl: item.imageUrl,
          unit: item.unit,
          currentStock,
          active: item.active,
          contents: item.contents,
          donationProjects: item.donationProjects,
          donationCount: validDonations.length,
          donations: validDonations,
        };
      })
    );

    return NextResponse.json(itemsWithStock);
  } catch (error) {
    console.error('Error fetching souvenir items for user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch souvenir items' },
      { status: 500 }
    );
  }
}
