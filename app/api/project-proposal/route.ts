import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { transporter, mailOptions } from '@/app/lib/nodemailer';

// GET: ดึงข้อมูล
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const budgetRoundId = searchParams.get('budgetRoundId');
    const fiscalYear = searchParams.get('fiscalYear'); // ✅ รับค่าปีงบประมาณ
    const status = searchParams.get('status');
    const trash = searchParams.get('trash');

    if (id) {
      const proposal = await prisma.projectProposal.findUnique({
        where: { id: parseInt(id) },
        include: { manager: true, budgetRound: true, staff: true },
      });
      if (!proposal) return NextResponse.json({ error: 'ไม่พบข้อมูลโครงการ' }, { status: 404 });
      return NextResponse.json({ proposal }, { status: 200 });
    }

    // เงื่อนไขการค้นหา
    const where: any = {
        budgetRoundId: { not: null }
    };
    
    // 1. Trash Filter
    if (trash === 'true') {
        where.deletedAt = { not: null };
    } else {
        where.deletedAt = null;
    }

    // 2. Budget Round ID Filter (ถ้ามี roundId เจาะจง)
    if (budgetRoundId) {
        where.budgetRoundId = parseInt(budgetRoundId);
    } 
    // 3. Fiscal Year Filter (ถ้าไม่มี roundId แต่มี year)
    else if (fiscalYear) {
        where.budgetRound = {
            fiscalYear: fiscalYear
        };
    }

    // 4. Status Filter
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

// ... (POST, PUT, DELETE functions remain the same as previous version)
// POST: สร้างข้อมูล
export async function POST(request: NextRequest) {
    try {
      const body = await request.json();
      const { project, manager } = body;
  
      let managerData = undefined;
      if (manager) {
        if (manager.id) {
          managerData = { connect: { id: Number(manager.id) } };
        } else {
          const whereCondition: any = {
              OR: [
                  {
                      AND: [
                          { firstName: { equals: manager.firstName, mode: 'insensitive' } },
                          { lastName: { equals: manager.lastName, mode: 'insensitive' } }
                      ]
                  }
              ]
          };
  
          if (manager.email && manager.email.trim() !== "") {
              whereCondition.OR.push({ email: manager.email });
          }
  
          const existingManager = await prisma.projectManager.findFirst({
              where: whereCondition
          });
  
          if (existingManager) {
              managerData = { connect: { id: existingManager.id } };
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
      }
  
      const roundId = project.budgetRoundId ? Number(project.budgetRoundId) : undefined;
      const staffId = project.staffId ? Number(project.staffId) : undefined;
  
      const newProposal = await prisma.projectProposal.create({
        data: {
          projectName: project.projectName,
          objective: project.objective,
          description: project.description,
          requestedAmount: Number(project.requestedAmount),
          responsibilityUnit: project.responsibilityUnit,
          coverFilePath: project.coverFilePath || null,
          projectStartDate: project.projectStartDate ? new Date(project.projectStartDate) : null,
          projectEndDate: project.projectEndDate ? new Date(project.projectEndDate) : null,
          status: project.status || 'PENDING',
          manager: managerData,
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
    
    if (body.restore === true && body.id) {
        const restoredProposal = await prisma.projectProposal.update({
            where: { id: Number(body.id) },
            data: { deletedAt: null },
        });
        return NextResponse.json({ message: 'กู้คืนสำเร็จ', proposal: restoredProposal }, { status: 200 });
    }

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

    if (status === 'OPEN' && updatedProposal.budgetRoundId) { 
      const eligibleVoters = await prisma.user.findMany({
        where: {
          role: 'ALUMNI',
          verification: { status: 'APPROVED' },
          budgetDonations: { some: { budgetRoundId: updatedProposal.budgetRoundId } }
        },
        select: { email: true, fullName: true }
      });

      const voteLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/user/vote`;

      const emailPromises = eligibleVoters.map((voter) => {
        const mailSubject = `📢 เชิญร่วมโหวตโครงการ: ${updatedProposal.projectName}`;
        const mailHtml = `
          <div style="font-family: 'Sarabun', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px;">
            <h2 style="color: #F26522;">ขอเชิญร่วมโหวตโครงการ</h2>
            <p>เรียนคุณ <strong>${voter.fullName}</strong>,</p>
            <p>โครงการ <strong>"${updatedProposal.projectName}"</strong> ได้ผ่านการพิจารณาและเปิดให้โหวตแล้ว</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${voteLink}" style="background-color: #F26522; color: white; padding: 12px 24px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block;">ไปที่หน้าโหวต</a>
            </div>
          </div>
        `;
        return transporter.sendMail({ ...mailOptions, to: voter.email, subject: mailSubject, html: mailHtml });
      });

      try { await Promise.all(emailPromises); } catch (e) { console.error("Failed to send emails:", e); }
    }

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