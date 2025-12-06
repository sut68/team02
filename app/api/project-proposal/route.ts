import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// GET - ดึงรายการข้อเสนอโครงการ (รองรับการกรองด้วย ID)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const budgetRoundId = searchParams.get('budgetRoundId');
    const status = searchParams.get('status');

    const proposals = await prisma.projectProposal.findMany({
      where: {
        deletedAt: null,
        // ✅ เพิ่มเงื่อนไขกรองตาม ID ถ้ามีส่งมา
        ...(id && { id: parseInt(id) }),
        ...(budgetRoundId && { budgetRoundId: parseInt(budgetRoundId) }),
        ...(status && { status: status as any }),
      },
      include: {
        budgetRound: true,
        manager: true,
        staff: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        summarySubmissions: {
          where: { deletedAt: null },
          select: {
            id: true,
            status: true,
            totalActualExpense: true,
            submissionDate: true,
          },
        },
        votes: {
          select: {
            id: true,
            voteWeight: true,
            alumniId: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // คำนวณคะแนนโหวตเพิ่มเข้าไปในผลลัพธ์
    const proposalsWithVoteCount = proposals.map(proposal => ({
      ...proposal,
      voteCount: proposal.votes.reduce((sum, v) => sum + v.voteWeight, 0),
      voterCount: proposal.votes.length,
    }));

    return NextResponse.json(
      { proposals: proposalsWithVoteCount },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching proposals:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    );
  }
}

// POST - สร้างข้อเสนอโครงการใหม่ (พร้อมสร้างผู้รับผิดชอบใน Transaction เดียว)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      projectName,
      objective,
      description,
      requestedAmount,
      projectStartDate,
      projectEndDate,
      responsibilityUnit,
      coverFilePath,
      budgetRoundId,
      manager, // ✅ รับข้อมูล manager เป็น object
      staffId,
    } = body;

    if (!projectName) {
      return NextResponse.json(
        { error: 'กรุณาระบุชื่อโครงการ' },
        { status: 400 }
      );
    }

    const proposal = await prisma.projectProposal.create({
      data: {
        projectName,
        objective,
        description,
        requestedAmount,
        projectStartDate: projectStartDate ? new Date(projectStartDate) : undefined,
        projectEndDate: projectEndDate ? new Date(projectEndDate) : undefined,
        responsibilityUnit,
        coverFilePath,
        budgetRoundId,
        staffId,
        status: 'DRAFT', // สถานะเริ่มต้น
        
        // ✅ Logic สร้าง Manager (Nested Write)
        // ถ้ามีข้อมูล manager ส่งมา ให้สร้างลงตาราง ProjectManager พร้อมกันเลย
        manager: manager ? {
          create: {
            firstName: manager.firstName,
            lastName: manager.lastName,
            department: manager.department,
            position: manager.position,
            phoneNumber: manager.phoneNumber,
            email: manager.email,
          }
        } : undefined
      },
      include: {
        budgetRound: true,
        manager: true,
        staff: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: 'สร้างข้อเสนอโครงการสำเร็จ',
        proposal,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating proposal:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสร้างข้อเสนอโครงการ' },
      { status: 500 }
    );
  }
}

// PUT - อัพเดทข้อเสนอโครงการ
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, scoreTotal, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'กรุณาระบุ ID ของโครงการ' },
        { status: 400 }
      );
    }

    const proposal = await prisma.projectProposal.update({
      where: { id },
      data: {
        ...updateData,
        ...(status && { status }),
        ...(scoreTotal !== undefined && { scoreTotal }),
        projectStartDate: updateData.projectStartDate
          ? new Date(updateData.projectStartDate)
          : undefined,
        projectEndDate: updateData.projectEndDate
          ? new Date(updateData.projectEndDate)
          : undefined,
      },
      include: {
        budgetRound: true,
        manager: true,
        staff: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: 'อัพเดทข้อเสนอโครงการสำเร็จ',
        proposal,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating proposal:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัพเดทข้อเสนอโครงการ' },
      { status: 500 }
    );
  }
}

// DELETE - ลบข้อเสนอโครงการ (Soft Delete)
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

    await prisma.projectProposal.update({
      where: { id: parseInt(id) },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json(
      { message: 'ลบข้อเสนอโครงการสำเร็จ' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting proposal:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบข้อเสนอโครงการ' },
      { status: 500 }
    );
  }
}