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

    // Normalize category field to code (safe for string | null)
    const normalizeCategory = (c: string | null) => {
      if (!c) return null;
      if (c === "กิจกรรม") return "ACTIVITY";
      if (c === "บริจาค") return "DONATION";
      return c;
    };
    const normalized = itemsWithStock.map((x) => ({ ...x, category: normalizeCategory(x.category) }));
    return NextResponse.json(normalized, { status: 200 });
  } catch (error) {
    console.error("Error fetching souvenir items:", error);
    return NextResponse.json([], { status: 500 });
  }
}


// POST - สร้างของที่ระลึกใหม่
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
      active,
      linkedType,
      linkedEventId,
      linkedDonationProjectId
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

    // ใช้ Transaction เพื่อสร้างของและผูกความสัมพันธ์พร้อมกัน
    const result = await prisma.$transaction(async (tx) => {
      // 1. สร้างของที่ระลึก
      const item = await tx.souvenirItem.create({
        data: {
          sku,
          name,
          description,
          category,
          imageUrl,
          unit,
          initialStock: initialStock || 0,
          active: active !== undefined ? active : true, // บันทึกสถานะ active
        },
      });

      // 2. จัดการการเชื่อมโยง (Linking Logic)
      if (linkedType === 'event' && linkedEventId) {
        // ตรวจสอบก่อนว่ากิจกรรมนั้นมีของผูกอยู่แล้วหรือไม่
        const targetEvent = await tx.content.findUnique({ where: { id: linkedEventId } });
        if (targetEvent?.souvenirItemId) {
          throw new Error('กิจกรรมนี้มีของที่ระลึกผูกอยู่แล้ว กรุณาเลือกกิจกรรมอื่น');
        }
        
        // อัปเดตกิจกรรมให้ชี้มาที่ของชิ้นนี้
        await tx.content.update({
          where: { id: linkedEventId },
          data: { souvenirItemId: item.id }
        });

      } else if (linkedType === 'donation' && linkedDonationProjectId) {
        // ตรวจสอบก่อนว่าโครงการนั้นมีของผูกอยู่แล้วหรือไม่
        const targetProject = await tx.donationProject.findUnique({ where: { id: linkedDonationProjectId } });
        if (targetProject?.souvenirItemId) {
           throw new Error('โครงการบริจาคนี้มีของที่ระลึกผูกอยู่แล้ว กรุณาเลือกโครงการอื่น');
        }

        // อัปเดตโครงการบริจาคให้ชี้มาที่ของชิ้นนี้
        await tx.donationProject.update({
          where: { id: linkedDonationProjectId },
          data: { souvenirItemId: item.id }
        });
      }

      return item;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Error creating souvenir item:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create souvenir item' },
      { status: 500 }
    );
  }
}