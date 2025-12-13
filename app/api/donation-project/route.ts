import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// GET - ดึงรายการโครงการระดมทุน
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const where = {
      ...(status && { status: status as any }),
    };

    const [projects, total] = await Promise.all([
      prisma.donationProject.findMany({
        where,
        include: {
          transactions: {
            where: { status: 'SUCCESS' },
            select: {
              amount: true,
              createdAt: true,
              donorName: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
          _count: {
            select: {
              transactions: {
                where: { status: 'SUCCESS' },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.donationProject.count({ where }),
    ]);

    // คำนวณเปอร์เซ็นต์ความสำเร็จ
    const projectsWithProgress = projects.map(project => ({
      ...project,
      progress: project.goalAmount > 0
        ? Math.min((project.currentAmount / project.goalAmount) * 100, 100)
        : 0,
      donorCount: project._count.transactions,
    }));

    return NextResponse.json(
      {
        projects: projectsWithProgress,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching donation projects:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    );
  }
}

// POST - สร้างโครงการระดมทุนใหม่
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      goalAmount,
      startDate,
      endDate,
      ownerName,
      contact,
      posterUrl,
    } = body;

    if (!title || !description || !goalAmount || !startDate || !endDate || !ownerName || !contact) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      );
    }

    const project = await prisma.donationProject.create({
      data: {
        title,
        description,
        goalAmount: parseFloat(goalAmount),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        ownerName,
        contact,
        posterUrl,
        status: 'OPEN',
      },
    });

    return NextResponse.json(
      {
        message: 'สร้างโครงการระดมทุนสำเร็จ',
        project,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating donation project:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสร้างโครงการ' },
      { status: 500 }
    );
  }
}

// PUT - อัพเดทโครงการระดมทุน
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'กรุณาระบุ ID ของโครงการ' },
        { status: 400 }
      );
    }

    const project = await prisma.donationProject.update({
      where: { id },
      data: {
        ...updateData,
        ...(status && { status }),
        ...(updateData.goalAmount && { goalAmount: parseFloat(updateData.goalAmount) }),
        ...(updateData.startDate && { startDate: new Date(updateData.startDate) }),
        ...(updateData.endDate && { endDate: new Date(updateData.endDate) }),
      },
    });

    return NextResponse.json(
      {
        message: 'อัพเดทโครงการสำเร็จ',
        project,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating donation project:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัพเดทโครงการ' },
      { status: 500 }
    );
  }
}

// DELETE - ลบโครงการระดมทุน
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'กรุณาระบุ ID ของโครงการ' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่ามีการบริจาคแล้วหรือไม่
    const transactionCount = await prisma.donationTransaction.count({
      where: {
        projectId: parseInt(id),
        status: 'SUCCESS',
      },
    });

    if (transactionCount > 0) {
      return NextResponse.json(
        { error: 'ไม่สามารถลบโครงการที่มีการบริจาคแล้วได้ กรุณาเปลี่ยนสถานะเป็น CLOSED แทน' },
        { status: 400 }
      );
    }

    await prisma.donationProject.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json(
      { message: 'ลบโครงการสำเร็จ' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting donation project:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบโครงการ' },
      { status: 500 }
    );
  }
}
