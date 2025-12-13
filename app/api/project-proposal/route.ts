import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { transporter, mailOptions } from '@/app/lib/nodemailer';

// GET: ดึงข้อมูล (เหมือนเดิม)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
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

    if (status === 'OPEN' && updatedProposal.budgetRoundId) { 
      
      const eligibleVoters = await prisma.user.findMany({
        where: {
          role: 'ALUMNI',
          verification: {
            status: 'APPROVED'
          },
          budgetDonations: {
            some: {
              budgetRoundId: updatedProposal.budgetRoundId
            }
          }
        },
        select: { email: true, fullName: true }
      });

      // สร้างลิงก์ไปยังหน้าโหวต
      const voteLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/user/vote`;

      // สร้าง Array ของ Promise สำหรับการส่งอีเมล
      const emailPromises = eligibleVoters.map((voter) => {
        const mailSubject = `📢 เชิญร่วมโหวตโครงการ: ${updatedProposal.projectName}`;
        
        const mailHtml = `
          <div style="font-family: 'Sarabun', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px;">
            <h2 style="color: #F26522;">ขอเชิญร่วมโหวตโครงการ</h2>
            <p>เรียนคุณ <strong>${voter.fullName}</strong>,</p>
            
            <p>โครงการ <strong>"${updatedProposal.projectName}"</strong> ได้ผ่านการพิจารณาและเปิดให้โหวตแล้ว</p>
            <p>เนื่องจากท่านเป็นผู้สนับสนุนในรอบงบประมาณนี้ ท่านจึงมีสิทธิ์ในการโหวตคัดเลือกโครงการ</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${voteLink}" 
                 style="background-color: #F26522; color: white; padding: 12px 24px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block;">
                ไปที่หน้าโหวต
              </a>
            </div>

            <p style="font-size: 14px; color: #666;">
              *กรุณาเข้าสู่ระบบก่อนทำการโหวต
            </p>
            <hr style="margin-top: 30px; border: 0; border-top: 1px solid #eee;" />
            <p style="font-size: 12px; color: #999;">
              อีเมลฉบับนี้เป็นการแจ้งเตือนอัตโนมัติจากระบบ AlumniConnect
            </p>
          </div>
        `;

        // สั่งส่งอีเมล (คืนค่า Promise กลับไป)
        return transporter.sendMail({
          ...mailOptions,
          to: voter.email,
          subject: mailSubject,
          html: mailHtml,
        });
      });

      // ✅ สั่งให้ทำงานพร้อมกันทั้งหมด และรอจนเสร็จ (หรือใช้ Promise.allSettled ถ้าไม่อยากให้ error เดียวทำล่มทั้งหมด)
      try {
        await Promise.all(emailPromises);
        console.log(`✅ Sent voting invitation emails to ${eligibleVoters.length} users.`);
      } catch (emailError) {
        console.error("❌ Failed to send some emails:", emailError);
        // ไม่ throw error เพื่อให้การ update status สำเร็จต่อไป
      }
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