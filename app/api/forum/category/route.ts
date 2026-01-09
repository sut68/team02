import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// GET - ดึงรายการหมวดหมู่
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            topics: {
              where: {
                status: 'ACTIVE',
              },
            },
          },
        },
      },
      orderBy: {
        categoryname: 'asc',
      },
    });

    return NextResponse.json({ categories }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    );
  }
}

// POST - สร้างหมวดหมู่ใหม่
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { categoryname } = body;

    if (!categoryname) {
      return NextResponse.json(
        { error: 'กรุณาระบุชื่อหมวดหมู่' },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: {
        categoryname,
      },
    });

    return NextResponse.json(
      {
        message: 'สร้างหมวดหมู่สำเร็จ',
        category,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสร้างหมวดหมู่' },
      { status: 500 }
    );
  }
}

// PUT - อัพเดทหมวดหมู่
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, categoryname } = body;

    if (!id || !categoryname) {
      return NextResponse.json(
        { error: 'กรุณาระบุข้อมูลให้ครบถ้วน' },
        { status: 400 }
      );
    }

    const category = await prisma.category.update({
      where: { id },
      data: { categoryname },
    });

    return NextResponse.json(
      {
        message: 'อัพเดทหมวดหมู่สำเร็จ',
        category,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัพเดทหมวดหมู่' },
      { status: 500 }
    );
  }
}

// DELETE - ลบหมวดหมู่
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'กรุณาระบุ ID ของหมวดหมู่' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่ามีกระทู้ในหมวดหมู่นี้หรือไม่
    const topicCount = await prisma.topic.count({
      where: { category_id: parseInt(id) },
    });

    if (topicCount > 0) {
      return NextResponse.json(
        { error: 'ไม่สามารถลบหมวดหมู่ที่มีกระทู้อยู่ได้' },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json(
      { message: 'ลบหมวดหมู่สำเร็จ' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบหมวดหมู่' },
      { status: 500 }
    );
  }
}
