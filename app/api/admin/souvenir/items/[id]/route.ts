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

    const item = await prisma.souvenirItem.update({
      where: { id },
      data: {
        name,
        description,
        category,
        imageUrl,
        unit,
        active,
      },
    });

    // เชื่อมโยงกับ Event หรือ Donation
    if (linkedType === 'event' && linkedEventId) {
      // ยกเลิกการผูกเก่าก่อน (ถ้ามี)
      await prisma.event.updateMany({
        where: { souvenirItemId: id },
        data: { souvenirItemId: null },
      });
      
      // ผูกใหม่
      await prisma.event.update({
        where: { id: linkedEventId },
        data: { souvenirItemId: id },
      });
    } else if (linkedType === 'donation' && linkedDonationProjectId) {
      // ปัจจุบัน Donation ไม่ได้เชื่อมกับ DonationProject โดยตรง
      // ไม่สามารถทำได้จนกว่าจะเพิ่ม projectId field
      console.log('Donation project linking not implemented - Donation model does not have projectId');
    } else if (linkedType === 'none') {
      // ยกเลิกการผูกทั้งหมด
      await prisma.event.updateMany({
        where: { souvenirItemId: id },
        data: { souvenirItemId: null },
      });
      // Donation จะไม่ยกเลิกเพราะไม่มี projectId
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error updating souvenir item:', error);
    return NextResponse.json(
      { error: 'Failed to update souvenir item' },
      { status: 500 }
    );
  }
}

// DELETE - ลบของที่ระลึก (soft delete โดยตั้ง active = false)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await params;
    const id = parseInt(paramId);

    // Soft delete
    const item = await prisma.souvenirItem.update({
      where: { id },
      data: { active: false },
    });

    return NextResponse.json({ message: 'Item deleted successfully', item });
  } catch (error) {
    console.error('Error deleting souvenir item:', error);
    return NextResponse.json(
      { error: 'Failed to delete souvenir item' },
      { status: 500 }
    );
  }
}
