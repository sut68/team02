import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { transporter, mailOptions } from '@/app/lib/nodemailer';

// GET: ดึงข้อมูล
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const budgetRoundId = searchParams.get('budgetRoundId');
    const fiscalYear = searchParams.get('fiscalYear'); 
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

    const where: any = { budgetRoundId: { not: null } };
    
    if (trash === 'true') {
        where.deletedAt = { not: null };
    } else {
        where.deletedAt = null;
    }

    if (budgetRoundId) {
        where.budgetRoundId = parseInt(budgetRoundId);
    } else if (fiscalYear) {
        where.budgetRound = { fiscalYear: fiscalYear };
    }

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

// POST: สร้างข้อมูล
export async function POST(request: NextRequest) {
    try {
      const body = await request.json();
      const { project, manager } = body;
  
      const roundId = project.budgetRoundId ? Number(project.budgetRoundId) : undefined;
      const cleanName = project.projectName ? project.projectName.trim() : '';

      // --- VALIDATION ชื่อโครงการ ---
      if (!cleanName) {
        return NextResponse.json({ error: 'ชื่อโครงการห้ามว่าง' }, { status: 400 });
      }
      if (cleanName.length < 3) {
        return NextResponse.json({ error: 'ชื่อโครงการสั้นเกินไป (ต้องมีอย่างน้อย 3 ตัวอักษร)' }, { status: 400 });
      }
      if (cleanName.length > 200) {
        return NextResponse.json({ error: 'ชื่อโครงการยาวเกินไป (ไม่เกิน 200 ตัวอักษร)' }, { status: 400 });
      }

      if (roundId) {
        const existingProject = await prisma.projectProposal.findFirst({
            where: { 
                projectName: { equals: cleanName, mode: 'insensitive' },
                budgetRoundId: roundId,
                deletedAt: null 
            }
        });
        if (existingProject) {
            return NextResponse.json({ error: 'ชื่อโครงการนี้มีอยู่ในรอบงบประมาณนี้แล้ว' }, { status: 409 });
        }
      }

      if (project.description && project.description.length > 500) {
        return NextResponse.json({ error: 'รายละเอียดโครงการต้องไม่เกิน 500 ตัวอักษร' }, { status: 400 });
      }

      if (project.requestedAmount !== undefined && project.requestedAmount !== null) {
        const amount = Number(project.requestedAmount);
        if (isNaN(amount) || amount <= 0) {
          return NextResponse.json({ error: 'งบประมาณที่ขอต้องมากกว่า 0' }, { status: 400 });
        }
        const amountStr = amount.toString();
        if (amountStr.includes('.') && amountStr.split('.')[1].length > 2) {
          return NextResponse.json({ error: 'งบประมาณต้องมีทศนิยมไม่เกิน 2 ตำแหน่ง' }, { status: 400 });
        }
      }

      if (project.projectStartDate) {
            const startDate = new Date(project.projectStartDate);
            if (isNaN(startDate.getTime())) {
                return NextResponse.json({ error: 'รูปแบบวันที่ไม่ถูกต้อง' }, { status: 400 });
            }
            const today = new Date();
            today.setHours(0, 0, 0, 0); 

            if (startDate < today) {
                return NextResponse.json({ error: 'วันเริ่มต้นโครงการต้องไม่เป็นอดีต (ต้องเริ่มตั้งแต่วันนี้เป็นต้นไป)' }, { status: 400 });
            }

            if (project.projectEndDate) {
                const endDate = new Date(project.projectEndDate);
                if (isNaN(endDate.getTime())) {
                    return NextResponse.json({ error: 'รูปแบบวันที่ไม่ถูกต้อง' }, { status: 400 });
                }
                if (endDate < startDate) {
                    return NextResponse.json({ error: 'วันสิ้นสุดโครงการต้องไม่อยู่ก่อนวันเริ่มต้น' }, { status: 400 });
                }
            }
        } else if (project.projectEndDate) {
             const endDate = new Date(project.projectEndDate);
             if (isNaN(endDate.getTime())) {
                return NextResponse.json({ error: 'รูปแบบวันที่ไม่ถูกต้อง' }, { status: 400 });
            }
        }
      
      if (project.coverFilePath) {
          const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
          const lowerCasePath = project.coverFilePath.toLowerCase();
          const isValidImage = validExtensions.some(ext => lowerCasePath.endsWith(ext));

          if (!isValidImage) {
              return NextResponse.json({ error: 'ไฟล์ภาพปกต้องเป็นไฟล์รูปภาพเท่านั้น (.jpg, .jpeg, .png, .webp)' }, { status: 400 });
          }
      }

      // ✅ 9. ตรวจสอบข้อมูลผู้รับผิดชอบโครงการ (Manager Validation)
      if (manager && !manager.id) {
          const managerFirstName = manager.firstName?.trim();
          const managerLastName = manager.lastName?.trim();
          const managerEmail = manager.email?.trim();

          // 9.1 เช็คชื่อ-นามสกุล
          if (!managerFirstName || !managerLastName) {
              return NextResponse.json({ error: 'ชื่อและนามสกุลผู้รับผิดชอบโครงการห้ามว่าง' }, { status: 400 });
          }

          // 9.2 เช็ครูปแบบอีเมล
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!managerEmail || !emailRegex.test(managerEmail)) {
              return NextResponse.json({ error: 'รูปแบบอีเมลผู้รับผิดชอบโครงการไม่ถูกต้อง' }, { status: 400 });
          }

          // 9.3 เช็คเบอร์โทรศัพท์ (ต้อง 10 หลัก)
          if (manager.phoneNumber) {
              if (manager.phoneNumber.length !== 10) {
                 return NextResponse.json({ error: 'เบอร์โทรศัพท์มือถือต้องมี 10 หลัก' }, { status: 400 });
              }
          }
      }

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
          const existingManager = await prisma.projectManager.findFirst({ where: whereCondition });
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
  
      const staffId = project.staffId ? Number(project.staffId) : undefined;
  
      const newProposal = await prisma.projectProposal.create({
        data: {
          projectName: cleanName, 
          objective: project.objective,
          description: project.description,
          requestedAmount: project.requestedAmount ? Number(project.requestedAmount) : undefined,
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

    if (data.projectName !== undefined) {
       data.projectName = data.projectName.trim(); // ✅ Fix: Trim และ update กลับเข้า data
       const cleanName = data.projectName;

       if (!cleanName) {
           return NextResponse.json({ error: 'ชื่อโครงการห้ามว่าง' }, { status: 400 });
       }
       if (cleanName.length < 3) {
           return NextResponse.json({ error: 'ชื่อโครงการสั้นเกินไป (ต้องมีอย่างน้อย 3 ตัวอักษร)' }, { status: 400 });
       }
       if (cleanName.length > 200) {
           return NextResponse.json({ error: 'ชื่อโครงการยาวเกินไป (ไม่เกิน 200 ตัวอักษร)' }, { status: 400 });
       }
    }

    if (data.description && data.description.length > 500) {
       return NextResponse.json({ error: 'รายละเอียดโครงการต้องไม่เกิน 500 ตัวอักษร' }, { status: 400 });
    }

    if (data.requestedAmount !== undefined && data.requestedAmount !== null) {
      const amount = Number(data.requestedAmount);
      if (isNaN(amount) || amount <= 0) {
        return NextResponse.json({ error: 'งบประมาณที่ขอต้องมากกว่า 0' }, { status: 400 });
      }
      const amountStr = amount.toString();
      if (amountStr.includes('.') && amountStr.split('.')[1].length > 2) {
         return NextResponse.json({ error: 'งบประมาณต้องมีทศนิยมไม่เกิน 2 ตำแหน่ง' }, { status: 400 });
      }
    }

    let newStartDate: Date | undefined;
    let newEndDate: Date | undefined;

    if (data.projectStartDate) {
        newStartDate = new Date(data.projectStartDate);
        if (isNaN(newStartDate.getTime())) {
             return NextResponse.json({ error: 'รูปแบบวันเริ่มต้นไม่ถูกต้อง' }, { status: 400 });
        }
    }
    if (data.projectEndDate) {
        newEndDate = new Date(data.projectEndDate);
        if (isNaN(newEndDate.getTime())) {
             return NextResponse.json({ error: 'รูปแบบวันสิ้นสุดไม่ถูกต้อง' }, { status: 400 });
        }
    }
    if (newStartDate && newEndDate) {
        if (newEndDate < newStartDate) {
            return NextResponse.json({ error: 'วันสิ้นสุดโครงการต้องไม่อยู่ก่อนวันเริ่มต้น' }, { status: 400 });
        }
    }

    if (data.coverFilePath) {
       const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
       const lowerCasePath = data.coverFilePath.toLowerCase();
       const isValidImage = validExtensions.some(ext => lowerCasePath.endsWith(ext));

       if (!isValidImage) {
           return NextResponse.json({ error: 'ไฟล์ภาพปกต้องเป็นไฟล์รูปภาพเท่านั้น (.jpg, .jpeg, .png, .webp)' }, { status: 400 });
       }
    }

    // ✅ ตรวจสอบข้อมูล Manager (เฉพาะกรณีที่มีการส่งมาและไม่ได้ส่ง id)
    if (manager && !manager.id) {
         const managerFirstName = manager.firstName?.trim();
         const managerLastName = manager.lastName?.trim();
         const managerEmail = manager.email?.trim();

         if (managerFirstName === "" || managerLastName === "") { // เช็คกรณีแก้เป็นค่าว่าง
             return NextResponse.json({ error: 'ชื่อและนามสกุลผู้รับผิดชอบโครงการห้ามว่าง' }, { status: 400 });
         }
         
         if (managerEmail) {
             const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
             if (!emailRegex.test(managerEmail)) {
                  return NextResponse.json({ error: 'รูปแบบอีเมลผู้รับผิดชอบโครงการไม่ถูกต้อง' }, { status: 400 });
             }
         }
         if (manager.phoneNumber && manager.phoneNumber.length !== 10) {
              return NextResponse.json({ error: 'เบอร์โทรศัพท์มือถือต้องมี 10 หลัก' }, { status: 400 });
         }
    }

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
        projectName: data.projectName, // ✅ ค่านี้ถูก Trim แล้ว
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
      include: { budgetRound: true }
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