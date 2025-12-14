import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// GET - ดึงรายการของที่ระลึกทั้งหมด
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const active = searchParams.get("active");

    const where: any = {};
    if (category) where.category = category;
    if (active !== null) where.active = active === "true";

    const items = await prisma.souvenirItem.findMany({
      where,
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
      linkedBookingId, // รับ linkedBookingId จาก body
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

    // ไม่สร้าง stock movement สำหรับ initialStock อีกต่อไป (initialStock เก็บใน field เดียว)

    // ไม่เชื่อมโยงกับ Event เพราะไม่มี Event model แล้ว
    // หากต้องการเชื่อมโยงกับ Donation Project ให้ implement เพิ่มเติมในอนาคต

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error creating souvenir item:', error);
    return NextResponse.json(
      { error: 'Failed to create souvenir item' },
      { status: 500 }
    );
  }
}
