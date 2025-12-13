import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// GET - ดึงรายการของที่ระลึกทั้งหมด
export async function GET(request: NextRequest) {
  try {
    const items = await prisma.souvenirItem.findMany({
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
          ...item,
          currentStock,
        };
      })
    );

    return NextResponse.json(itemsWithStock);
  } catch (error) {
    console.error('Error fetching souvenir items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch souvenir items' },
      { status: 500 }
    );
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
      linkedType,
      linkedEventId,
      linkedDonationProjectId,
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

    // เชื่อมโยงกับ Event หรือ Donation
    if (linkedType === 'event' && linkedEventId) {
      await prisma.event.update({
        where: { id: linkedEventId },
        data: { souvenirItemId: item.id },
      });
    } else if (linkedType === 'donation' && linkedDonationProjectId) {
      // สำหรับโครงการบริจาค เราจะเก็บ mapping ไว้ใน metadata หรือใช้วิธีอื่น
      // ปัจจุบัน Donation ไม่ได้เชื่อมกับ DonationProject โดยตรง
      // สามารถอัพเดท Donation ทั้งหมดที่มี purpose ตรงกับโครงการได้
      // หรือเก็บข้อมูลไว้ใน SouvenirItem.description
      // แต่ถ้าต้องการใช้งานจริง ควรเพิ่ม projectId ใน Donation model
      console.log('Donation project linking not implemented - Donation model does not have projectId');
    }

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error creating souvenir item:', error);
    return NextResponse.json(
      { error: 'Failed to create souvenir item' },
      { status: 500 }
    );
  }
}
