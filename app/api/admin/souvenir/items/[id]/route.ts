import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// GET - ดึงข้อมูลของที่ระลึกตาม ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await params;
    const id = parseInt(paramId);
    
    const item = await prisma.souvenirItem.findUnique({
      where: { id },
      include: {
        movements: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        contents: { select: { id: true, TitleName: true }, take: 1 },
        donationProjects: { select: { id: true, title: true }, take: 1 },
        _count: {
          select: {
            entitlements: true,
            redemptions: true,
            shipments: true,
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Souvenir item not found' },
        { status: 404 }
      );
    }

    // คำนวณสต็อกคงเหลือ
    const totalDelta = item.movements.reduce((sum: number, m) => sum + m.delta, 0);
    const currentStock = item.initialStock + totalDelta;

    return NextResponse.json({
      ...item,
      currentStock,
      linkedEventId: item.contents[0]?.id || null,
      linkedDonationProjectId: item.donationProjects[0]?.id || null,
    });
  } catch (error) {
    console.error('Error fetching souvenir item:', error);
    return NextResponse.json(
      { error: 'Failed to fetch souvenir item' },
      { status: 500 }
    );
  }
}

// PUT - อัพเดตข้อมูลของที่ระลึก
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await params;
    const id = parseInt(paramId);
    const body = await request.json();
    const { 
      name, 
      description, 
      category, 
      imageUrl, 
      unit, 
      active,
      linkedType,
      linkedEventId,
      linkedDonationProjectId,
    } = body;

    // ใช้ transaction เพื่อความถูกต้อง
    const updated = await prisma.$transaction(async (tx) => {
      // 1. อัปเดตข้อมูลพื้นฐาน
      const item = await tx.souvenirItem.update({
        where: { id },
        data: { name, description, category, imageUrl, unit, active },
      });

      // 2. Reset การเชื่อมโยงเก่าทั้งหมด
      await tx.content.updateMany({ where: { souvenirItemId: id }, data: { souvenirItemId: null } });
      await tx.donationProject.updateMany({ where: { souvenirItemId: id }, data: { souvenirItemId: null } });

      // 3. สร้างการเชื่อมโยงใหม่ (ถ้ามี)
      if (linkedType === 'event' && linkedEventId) {
        const targetEvent = await tx.content.findUnique({ where: { id: linkedEventId } });
        if (targetEvent?.souvenirItemId && targetEvent.souvenirItemId !== id) {
          throw new Error('กิจกรรมนี้มีของที่ระลึกผูกอยู่แล้ว กรุณาปลดออกก่อน');
        }
        await tx.content.update({ where: { id: linkedEventId }, data: { souvenirItemId: id } });
      } else if (linkedType === 'donation' && linkedDonationProjectId) {
        const targetProject = await tx.donationProject.findUnique({ where: { id: linkedDonationProjectId } });
        if (targetProject?.souvenirItemId && targetProject.souvenirItemId !== id) {
          throw new Error('โครงการนี้มีของที่ระลึกผูกอยู่แล้ว กรุณาปลดออกก่อน');
        }
        await tx.donationProject.update({ where: { id: linkedDonationProjectId }, data: { souvenirItemId: id } });
      }
      return item;
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating souvenir item:', error);
    return NextResponse.json(
      { error: 'Failed to update souvenir item' },
      { status: 500 }
    );
  }
}

// DELETE - ลบของที่ระลึก (Hard delete - ลบจริง ๆ)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await params;
    const id = parseInt(paramId);

    // Hard delete - ลบข้อมูลจริง ๆ พร้อมกับการเชื่อมโยงทั้งหมด
    await prisma.$transaction(async (tx) => {
      // 1. ลบการเชื่อมโยงจาก Content
      await tx.content.updateMany({
        where: { souvenirItemId: id },
        data: { souvenirItemId: null },
      });

      // 2. ลบการเชื่อมโยงจาก DonationProject
      await tx.donationProject.updateMany({
        where: { souvenirItemId: id },
        data: { souvenirItemId: null },
      });

      // 3. ลบ StockMovement ทั้งหมด
      await tx.stockMovement.deleteMany({
        where: { itemId: id },
      });

      // 4. ลบ Entitlement ทั้งหมด
      await tx.entitlement.deleteMany({
        where: { itemId: id },
      });

      // 5. ลบ Redemption ทั้งหมด
      await tx.redemption.deleteMany({
        where: { itemId: id },
      });

      // 6. ลบ Shipment ทั้งหมด
      await tx.shipment.deleteMany({
        where: { itemId: id },
      });

      // 7. ลบ Donation ที่เชื่อมโยง
      await tx.donation.deleteMany({
        where: { souvenirItemId: id },
      });

      // 8. ลบ SouvenirItem เอง
      await tx.souvenirItem.delete({
        where: { id },
      });
    });

    return NextResponse.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting souvenir item:', error);
    return NextResponse.json(
      { error: 'Failed to delete souvenir item' },
      { status: 500 }
    );
  }
}
