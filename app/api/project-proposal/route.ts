import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// GET: ดึงข้อมูล (เหมือนเดิม)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const budgetRoundId = searchParams.get('budgetRoundId');
    const status = searchParams.get('status');

    if (id) {
      const proposal = await prisma.projectProposal.findUnique({
        where: { id: parseInt(id) },
        include: { manager: true, budgetRound: true, staff: true },
      });
      if (!proposal) return NextResponse.json({ error: 'ไม่พบข้อมูลโครงการ' }, { status: 404 });
      return NextResponse.json({ proposal }, { status: 200 });
    }

    const where: any = { deletedAt: null };
    if (budgetRoundId) where.budgetRoundId = parseInt(budgetRoundId);
    if (status) where.status = status;

    const proposals = await prisma.projectProposal.findMany({
      where,
      include: {
        manager: true,
        budgetRound: true,
        staff: true,
        votes: { select: { voteWeight: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ proposals }, { status: 200 });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' }, { status: 500 });
  }
}

// POST: สร้างข้อมูล (✅ แก้ไขให้รองรับ budgetRoundId และ staffId)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { project, manager } = body;

    // เตรียมข้อมูล Manager (เชื่อมโยง หรือ สร้างใหม่)
    let managerData = undefined;
    if (manager) {
      if (manager.id) {
        managerData = { connect: { id: Number(manager.id) } };
      } else {
        managerData = {
          create: {
            firstName: manager.firstName,
            lastName: manager.lastName,
            department: manager.department,
            position: manager.position,
            phoneNumber: manager.phoneNumber,
            email: manager.email,
          }
        };
      }
    }

    // ✅ แปลงค่า budgetRoundId และ staffId ให้เป็นตัวเลข หรือ undefined
    const roundId = project.budgetRoundId ? Number(project.budgetRoundId) : undefined;
    const staffId = project.staffId ? Number(project.staffId) : undefined;

    const newProposal = await prisma.projectProposal.create({
      data: {
        projectName: project.projectName,
        objective: project.objective,
        description: project.description,
        requestedAmount: Number(project.requestedAmount),
        responsibilityUnit: project.responsibilityUnit,
        coverFilePath: project.coverFilePath,
        projectStartDate: project.projectStartDate ? new Date(project.projectStartDate) : null,
        projectEndDate: project.projectEndDate ? new Date(project.projectEndDate) : null,
        status: 'PENDING',
        manager: managerData,
        
        // ✅ เพิ่มการเชื่อมโยง BudgetRound และ Staff (ถ้ามีค่าส่งมา)
        budgetRound: roundId ? { connect: { id: roundId } } : undefined,
        staff: staffId ? { connect: { id: staffId } } : undefined,
      },
      include: { manager: true, budgetRound: true, staff: true }
    });

    return NextResponse.json({ message: 'บันทึกสำเร็จ', proposal: newProposal }, { status: 201 });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'บันทึกไม่สำเร็จ' }, { status: 500 });
  }
}

// PUT: แก้ไขข้อมูล
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, manager, ...data } = body;

    if (!id) return NextResponse.json({ error: 'ไม่พบ ID' }, { status: 400 });

    let managerUpdate = undefined;
    if (manager && manager.id) {
        managerUpdate = {
            update: {
                firstName: manager.firstName,
                lastName: manager.lastName,
                department: manager.department,
                position: manager.position,
                phoneNumber: manager.phoneNumber,
                email: manager.email
            }
        };
    }

    const updatedProposal = await prisma.projectProposal.update({
      where: { id: Number(id) },
      data: {
        projectName: data.projectName,
        objective: data.objective,
        description: data.description,
        requestedAmount: data.requestedAmount ? Number(data.requestedAmount) : undefined,
        responsibilityUnit: data.responsibilityUnit,
        coverFilePath: data.coverFilePath,
        projectStartDate: data.projectStartDate ? new Date(data.projectStartDate) : undefined,
        projectEndDate: data.projectEndDate ? new Date(data.projectEndDate) : undefined,
        status: status, 
        ...(managerUpdate && { manager: managerUpdate })
      },
    });

    return NextResponse.json({ message: 'แก้ไขสำเร็จ', proposal: updatedProposal }, { status: 200 });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'แก้ไขไม่สำเร็จ' }, { status: 500 });
  }
}

// DELETE: ลบข้อมูล
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ไม่พบ ID' }, { status: 400 });

    await prisma.projectProposal.update({
      where: { id: parseInt(id) },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ message: 'ลบสำเร็จ' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'ลบไม่สำเร็จ' }, { status: 500 });
  }
}
