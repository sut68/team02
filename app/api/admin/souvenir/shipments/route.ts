import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { Prisma } from '@prisma/client';

// GET - ดึงรายการจัดส่งทั้งหมด
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const donationId = searchParams.get('donationId');

    const where: any = {};
    if (status) where.status = status;
    if (donationId) where.donationId = parseInt(donationId);

    const shipments = await prisma.shipment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        item: {
          select: {
            id: true,
            sku: true,
            name: true,
            imageUrl: true,
          },
        },
        donation: {
          select: {
            id: true,
            amount: true,
            donatedAt: true,
          },
        },
      },
    });

    return NextResponse.json(shipments);
  } catch (error) {
    console.error('Error fetching shipments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipments' },
      { status: 500 }
    );
  }
}

// POST - สร้างรายการจัดส่งใหม่
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      donationId,
      userId,
      itemId,
      qty,
      receiverName,
      addressLine,
      subdistrict,
      district,
      province,
      postalCode,
      phone,
    } = body;

    // Validate required fields
    if (!donationId || !userId || !itemId || !receiverName || !addressLine) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // ตรวจสอบสต็อก
    const item = await prisma.souvenirItem.findUnique({
      where: { id: itemId },
      include: { movements: true },
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    const totalDelta = item.movements.reduce((sum: number, m) => sum + m.delta, 0);
    const currentStock = item.initialStock + totalDelta;

    if (currentStock < (qty || 1)) {
      return NextResponse.json(
        { error: 'Insufficient stock' },
        { status: 400 }
      );
    }

    // สร้าง shipment และตัดสต็อก
    const shipment = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // สร้าง shipment
      const newShipment = await tx.shipment.create({
        data: {
          donationId,
          userId,
          itemId,
          qty: qty || 1,
          receiverName,
          addressLine,
          subdistrict: subdistrict || '',
          district: district || '',
          province: province || '',
          postalCode: postalCode || '',
          phone: phone || '',
          status: 'PENDING',
        },
        include: {
          user: true,
          item: true,
          donation: true,
        },
      });

      // ตัดสต็อก
      await tx.stockMovement.create({
        data: {
          itemId,
          delta: -(qty || 1),
          reason: 'ship',
          refType: 'Shipment',
        },
      });

      // อัปเดต Entitlement.qtyUsed (ถ้ามี Entitlement ตรงกับ userId, itemId, donationId)
      const entitlement = await tx.entitlement.findFirst({
        where: {
          userId,
          itemId,
          donationId,
        },
      });
      if (entitlement) {
        await tx.entitlement.update({
          where: { id: entitlement.id },
          data: { qtyUsed: { increment: qty || 1 } },
        });
      }

      return newShipment;
    });

    return NextResponse.json(shipment, { status: 201 });
  } catch (error) {
    console.error('Error creating shipment:', error);
    return NextResponse.json(
      { error: 'Failed to create shipment' },
      { status: 500 }
    );
  }
}
