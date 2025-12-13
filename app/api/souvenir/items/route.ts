import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// GET - ดึงรายการของที่ระลึกสำหรับ user (เฉพาะที่ active)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const items = await prisma.souvenirItem.findMany({
      where: {
        active: true, // เฉพาะของที่กำลังใช้งาน
        ...(category && { category }), // กรองตาม category ถ้ามี
      },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            movements: true,
            entitlements: true,
            redemptions: true,
            shipments: true,
          },
        },
      },
    });

    // คำนวณสต็อกคงเหลือจริง
    const itemsWithStock = await Promise.all(
      items.map(async (item) => {
        const movements = await prisma.stockMovement.findMany({
          where: { itemId: item.id },
        });
        
        const totalDelta = movements.reduce((sum: number, m) => sum + m.delta, 0);
        const currentStock = item.initialStock + totalDelta;

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
