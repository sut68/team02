import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// GET - ดึงรายการของที่ระลึกทั้งหมด
export async function GET(request: NextRequest) {
  try {
    const items = await prisma.souvenirItem.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        booking: true,
      },
    });

    const itemsWithStock = await Promise.all(
      items.map(async (item) => {
        const agg = await prisma.stockMovement.aggregate({
          where: { itemId: item.id },
          _sum: { delta: true },
        });

        const totalDelta = agg._sum.delta ?? 0;
        const currentStock = item.initialStock + totalDelta;

        return { ...item, currentStock };
      })
    );

    return NextResponse.json(itemsWithStock, { status: 200 });
  } catch (error) {
    console.error("Error fetching souvenir items:", error);
    return NextResponse.json([], { status: 500 });
  }
}


// POST - สร้างของที่ระลึกใหม่
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      sku, 
      name, 
      description, 
      category, 
      imageUrl, 
      unit, 
      initialStock,
      linkedBookingId, // ใช้ field ที่ schema รองรับเท่านั้น
    } = body;

    // Validate required fields
    if (!sku || !name) {
      return NextResponse.json(
        { error: 'SKU and name are required' },
        { status: 400 }
      );
    }

    // Check if SKU already exists
    const existing = await prisma.souvenirItem.findUnique({
      where: { sku },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'SKU already exists' },
        { status: 400 }
      );
    }

    const item = await prisma.souvenirItem.create({
      data: {
        sku,
        name,
        description,
        category,
        imageUrl,
        unit,
        initialStock: initialStock || 0,
        linkedBookingId: linkedBookingId || null,
      },
      include: {
        booking: true,
      },
    });

    // สร้าง stock movement เริ่มต้น
    if (initialStock && initialStock > 0) {
      await prisma.stockMovement.create({
        data: {
          itemId: item.id,
          delta: initialStock,
          reason: 'initial_stock',
          refType: 'Initial',
        },
      });
    }

    // ไม่เชื่อมโยงกับ Event หรือ Donation แบบ hardcode อีกต่อไป ใช้ schema-driven เท่านั้น

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error creating souvenir item:', error);
    return NextResponse.json(
      { error: 'Failed to create souvenir item' },
      { status: 500 }
    );
  }
}
