import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// POST - เพิ่ม/ลด สต็อก
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemId, delta, reason, createdBy } = body;

    // Validate
    if (!itemId || delta === undefined || delta === 0) {
      return NextResponse.json(
        { error: 'itemId and delta (non-zero) are required' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่าของมีอยู่จริง
    const item = await prisma.souvenirItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Souvenir item not found' },
        { status: 404 }
      );
    }

    // คำนวณสต็อกปัจจุบัน
    const movements = await prisma.stockMovement.findMany({
      where: { itemId },
    });
    const totalDelta = movements.reduce((sum: number, m) => sum + m.delta, 0);
    const currentStock = item.initialStock + totalDelta;

    // ถ้าเป็นการลดสต็อก ตรวจสอบว่ามีของเพียงพอ
    if (delta < 0 && currentStock + delta < 0) {
      return NextResponse.json(
        { error: 'Insufficient stock' },
        { status: 400 }
      );
    }

    // สร้าง movement
    const movement = await prisma.stockMovement.create({
      data: {
        itemId,
        delta,
        reason: reason || 'manual_adjust',
        refType: 'Manual',
        createdBy,
      },
    });

    // คำนวณสต็อกใหม่
    const newStock = currentStock + delta;

    return NextResponse.json({
      movement,
      currentStock: newStock,
      item,
    });
  } catch (error) {
    console.error('Error adjusting stock:', error);
    return NextResponse.json(
      { error: 'Failed to adjust stock' },
      { status: 500 }
    );
  }
}

// GET - ดูประวัติการเคลื่อนไหวสต็อก
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');

    const where = itemId ? { itemId: parseInt(itemId) } : {};

    const movements = await prisma.stockMovement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        item: {
          select: {
            id: true,
            sku: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(movements);
  } catch (error) {
    console.error('Error fetching stock movements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock movements' },
      { status: 500 }
    );
  }
}
