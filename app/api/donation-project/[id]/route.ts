import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// GET - ดึงข้อมูลโครงการพร้อมรายละเอียดการบริจาค
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
// export async function GET(
//   request: NextRequest,
//   { params }: { params: Promise<{ id: string }> } 
// ) {
  try {
    const { id } = await params;
    const projectId = parseInt(id);
    const { searchParams } = new URL(request.url);
    const includeTransactions = searchParams.get('includeTransactions') === 'true';

    const project = await prisma.donationProject.findUnique({
      where: { id: projectId },
      include: {
        transactions: includeTransactions
          ? {
            where: {
              status: 'SUCCESS',
              isPublic: true,
            },
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              postalCode: true,
              address: true,
              subdistrict: true,
              district: true,
              province: true,
              amount: true,
              message: true,
              createdAt: true,
              user: {
                select: {
                  fullName: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          }
          : false,
        _count: {
          select: {
            transactions: {
              where: { status: 'SUCCESS' },
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'ไม่พบโครงการ' },
        { status: 404 }
      );
    }

    const projectWithStats = {
      ...project,
      progress: project.goalAmount > 0
        ? Math.min((project.currentAmount / project.goalAmount) * 100, 100)
        : 0,
      donorCount: project._count.transactions,
      daysLeft: Math.max(
        0,
        Math.ceil((new Date(project.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      ),
    };

    return NextResponse.json({ project: projectWithStats }, { status: 200 });
  } catch (error) {
    console.error('Error fetching donation project:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    );
  }
}

// PUT - อัพเดทโครงการระดมทุน
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const projectId = parseInt(id);

  const body = await request.json();
  const { status, ...updateData } = body;

  try {
    if (isNaN(projectId)) {
      return NextResponse.json({ error: "Project ID ไม่ถูกต้อง" }, { status: 400 });
    }

    const project = await prisma.donationProject.update({
      where: { id: projectId },
      data: {
        ...updateData,
        ...(status && { status }),
        ...(updateData.goalAmount !== undefined && { goalAmount: parseFloat(updateData.goalAmount) }),
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
    // 💡 ตรวจสอบ Error ที่เกิดจากการอัปเดต (เช่น ID ไม่พบ)
    if (error instanceof Error && (error as any).code === 'P2025') {
      return NextResponse.json(
        { error: 'ไม่พบโครงการที่ต้องการอัพเดท' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัพเดทโครงการ' },
      { status: 500 }
    );
  }
}

// --------------------------------------------------------------------------
// DELETE - ลบโครงการระดมทุน (ใช้ ID จาก Path)
// --------------------------------------------------------------------------
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // 💡 ดึง ID จาก Path Parameter
    const projectId = parseInt(id);

    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: 'Project ID ไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่ามีการบริจาคแล้วหรือไม่
    const transactionCount = await prisma.donationTransaction.count({
      where: {
        projectId: projectId,
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
      where: { id: projectId },
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