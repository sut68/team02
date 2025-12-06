import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// GET - ดึงรายการข้อเสนอโครงการ
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const budgetRoundId = searchParams.get('budgetRoundId');
    const status = searchParams.get('status');

    const proposals = await prisma.projectProposal.findMany({
      where: {
        deletedAt: null,
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

    // คำนวณคะแนนโหวต
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

// POST - สร้างข้อเสนอโครงการใหม่
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Destructure ข้อมูล project และ manager ออกจาก body
    const { project, manager } = body;

    // 1. Validation เบื้องต้น
    if (!project || !project.projectName) {
      return NextResponse.json(
        { error: 'กรุณาระบุชื่อโครงการ' },
        { status: 400 }
      );
    }

    if (!project.budget && !project.requestedAmount) {
      return NextResponse.json(
        { error: 'กรุณาระบุงบประมาณ' },
        { status: 400 }
      );
    }

    // 2. เตรียมข้อมูลสำหรับ ProjectManager (Connect หรือ Create)
    let managerRelation = {};

    if (manager) {
      if (manager.id) {
        // กรณี A: มี ID ส่งมา (เลือกจากการค้นหา) -> ให้ Connect
        managerRelation = {
          connect: { id: Number(manager.id) }
        };
      } else {
        // กรณี B: ไม่มี ID (กรอกใหม่) -> ให้ Create
        
        // จัดการชื่อ-นามสกุล (เผื่อ Frontend ส่งมาเป็น name รวม หรือแยก firstName/lastName)
        let fName = manager.firstName;
        let lName = manager.lastName;
        
        // Fallback: ถ้าส่งมาเป็น name string เดียว ให้ลองแยกเอง
        if (!fName && manager.name) {
             const parts = manager.name.trim().split(' ');
             fName = parts[0];
             lName = parts.slice(1).join(' ') || '';
        }

        managerRelation = {
          create: {
            firstName: fName || 'ไม่ระบุ',
            lastName: lName || '',
            department: manager.department || manager.division, // รองรับทั้งสองชื่อ
            position: manager.position,
            phoneNumber: manager.phoneNumber || manager.phone, // รองรับทั้งสองชื่อ
            email: manager.email,
          }
        };
      }
    }

    // 3. บันทึกลง Database (ProjectProposal)
    const proposal = await prisma.projectProposal.create({
      data: {
        // --- Map Fields ให้ตรงกับ Schema ---
        projectName: project.name || project.projectName, 
        objective: project.objective,
        description: project.description || project.rationale, // ใช้ description ตาม schema
        requestedAmount: parseFloat(project.budget || project.requestedAmount || 0),
        responsibilityUnit: project.responsibilityUnit,
        coverFilePath: project.coverFilePath,
        
        // แปลงวันที่ (ถ้ามี)
        projectStartDate: project.dateStart || project.projectStartDate ? new Date(project.dateStart || project.projectStartDate) : null,
        projectEndDate: project.dateEnd || project.projectEndDate ? new Date(project.dateEnd || project.projectEndDate) : null,
        
        status: 'PENDING', // กำหนดสถานะเริ่มต้น

        // --- เชื่อมโยง Relations ---
        // เชื่อม BudgetRound (ถ้ามีส่งมา)
        budgetRound: project.budgetRoundId ? { connect: { id: Number(project.budgetRoundId) } } : undefined,
        
        // เชื่อม User/Staff ผู้สร้าง (ถ้ามีส่งมา)
        staff: project.staffId ? { connect: { id: Number(project.staffId) } } : undefined,

        // เชื่อม ProjectManager (Logic ที่เตรียมไว้ข้างบน)
        manager: Object.keys(managerRelation).length > 0 ? managerRelation : undefined,
      },
      include: {
        manager: true,      // return ข้อมูล manager กลับมาด้วย
        budgetRound: true,  // return ข้อมูลรอบงบประมาณกลับมาด้วย
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

// DELETE - ลบข้อเสนอโครงการ (soft delete)
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
