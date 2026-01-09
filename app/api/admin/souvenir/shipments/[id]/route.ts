import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// PUT - อัพเดทสถานะการจัดส่ง

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await params;
    if (!paramId || isNaN(Number(paramId))) {
      return NextResponse.json({ error: 'Invalid shipment id' }, { status: 400 });
    }
    const id = parseInt(paramId);
    const body = await request.json();
    const { status, trackingNo } = body;

    const validStatuses = ['PENDING', 'IN_TRANSIT', 'DELIVERED', 'FAILED'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // ตรวจสอบ shipment ก่อนอัปเดต
    const existingShipment = await prisma.shipment.findUnique({
      where: { id },
    });
    if (!existingShipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    // ใช้ transaction เพื่ออัปเดต Entitlement ด้วยถ้าส่งสำเร็จ
    const result = await prisma.$transaction(async (tx) => {
      const shipment = await tx.shipment.update({
        where: { id },
        data: {
          ...(status && { status }),
          ...(trackingNo !== undefined && { trackingNo }),
        },
        include: {
          user: true,
          item: true,
          donation: true,
        },
      });

      // ถ้าอัปเดตเป็น DELIVERED ให้เพิ่ม qtyUsed ใน Entitlement
      if (status === 'DELIVERED') {
        const entitlement = await tx.entitlement.findFirst({
          where: {
            userId: shipment.userId,
            itemId: shipment.itemId,
            donationId: shipment.donationId,
          },
        });
        if (entitlement) {
          await tx.entitlement.update({
            where: { id: entitlement.id },
            data: { qtyUsed: { increment: shipment.qty } },
          });
        }
      }
      return shipment;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating shipment:', error);
    return NextResponse.json({ error: 'Failed to update shipment' }, { status: 500 });
  }
}

// GET - ดึงข้อมูล shipment ตาม ID

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await params;
    if (!paramId || isNaN(Number(paramId))) {
      return NextResponse.json({ error: 'Invalid shipment id' }, { status: 400 });
    }
    const id = parseInt(paramId);

    const shipment = await prisma.shipment.findUnique({
      where: { id },
      include: {
        user: true,
        item: true,
        donation: true,
      },
    });

    if (!shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    return NextResponse.json(shipment);
  } catch (error) {
    console.error('Error fetching shipment:', error);
    return NextResponse.json({ error: 'Failed to fetch shipment' }, { status: 500 });
  }
}
