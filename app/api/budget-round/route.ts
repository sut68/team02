import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// Helper: แกะ User ID จาก Token
function getUserFromToken(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number; email: string; role: string };
  } catch (e) {
    return null;
  }
}

// GET - ดึงรายการรอบงบประมาณ
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fiscalYear = searchParams.get('fiscalYear');

    const budgetRounds = await prisma.budgetRound.findMany({
      where: {
        deletedAt: null,
        ...(fiscalYear && { fiscalYear }),
      },
      include: {
        creator: {
          select: { id: true, fullName: true, email: true },
        },
        proposals: {
          where: { deletedAt: null },
          select: { id: true, projectName: true, status: true, requestedAmount: true },
        },
        budgetDonations: {
          select: { amount: true },
        },
      },
      // ✅ เรียงลำดับ: เอา OPEN ขึ้นก่อนเสมอ (ต้องมั่นใจว่า Enum ใน Schema เรียงลำดับเหมาะสม หรือใช้ Logic นี้)
      // หาก Enum คือ PREPARING, OPEN, CLOSED -> การเรียงอาจจะไม่ตรงใจเป๊ะๆ 
      // แนะนำให้ Frontend ดึงไปแล้ว Filter เอา OPEN ไว้บนสุดจะง่ายกว่า หรือใช้ orderBy หลายชั้น
      orderBy: [
        { startDate: 'desc' } // เรียงตามวันที่ล่าสุดก่อน
      ]
    });

    // คำนวณยอดรวม
    const roundsWithStats = budgetRounds.map(round => {
      const totalRequested = round.proposals.reduce((sum, p) => sum + (p.requestedAmount || 0), 0);
      const totalDonated = round.budgetDonations.reduce((sum, d) => sum + d.amount, 0);

      return {
        ...round,
        stats: {
          totalProposals: round.proposals.length,
          totalRequested,
          totalDonated,
          remaining: (round.totalBudget || 0) - totalRequested,
        },
      };
    });

    return NextResponse.json({ budgetRounds: roundsWithStats }, { status: 200 });
  } catch (error) {
    console.error('Error fetching budget rounds:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' }, { status: 500 });
  }
}

// POST - สร้างรอบงบประมาณใหม่
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    if (!user) return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบก่อนทำรายการ' }, { status: 401 });
    if (user.role !== 'ADMIN') return NextResponse.json({ error: 'คุณไม่มีสิทธิ์ทำรายการนี้' }, { status: 403 });

    const body = await request.json();
    const {
      roundName,
      fiscalYear,
      totalBudget,
      startDate,
      endDate,
      status // ✅ รับค่า status (เผื่อสร้างแล้วเปิดเลย หรือสร้างแบบ draft)
    } = body;

    if (!roundName) {
      return NextResponse.json({ error: 'กรุณาระบุชื่อรอบงบประมาณ' }, { status: 400 });
    }

    const budgetRound = await prisma.budgetRound.create({
      data: {
        roundName,
        fiscalYear,
        totalBudget: totalBudget || 0,
        startDate: startDate ? new Date(startDate) : new Date(), // ควรมี Default หรือ Validate
        endDate: endDate ? new Date(endDate) : new Date(),
        creatorId: user.userId,
        status: status || 'PREPARING' // ✅ ถ้าไม่ส่งมา ให้ Default เป็น PREPARING
      },
      include: {
        creator: { select: { id: true, fullName: true, email: true } },
      },
    });

    return NextResponse.json({ message: 'สร้างรอบงบประมาณสำเร็จ', budgetRound }, { status: 201 });
  } catch (error) {
    console.error('Error creating budget round:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการสร้างรอบงบประมาณ' }, { status: 500 });
  }
}

// PUT - อัพเดทรอบงบประมาณ (แก้ไขสถานะได้ที่นี่)
export async function PUT(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    if (!user || user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = body; // updateData จะมี status ติดมาด้วยถ้าส่งมา

    if (!id) {
      return NextResponse.json({ error: 'กรุณาระบุ ID ของรอบงบประมาณ' }, { status: 400 });
    }

    // ✅ เตรียมข้อมูลที่จะ Update
    const dataToUpdate: any = {
      roundName: updateData.roundName,
      fiscalYear: updateData.fiscalYear,
      totalBudget: updateData.totalBudget,
    };

    if (updateData.startDate) dataToUpdate.startDate = new Date(updateData.startDate);
    if (updateData.endDate) dataToUpdate.endDate = new Date(updateData.endDate);
    
    // ✅ เพิ่มการอัปเดต Status (สำคัญมากสำหรับการเปลี่ยน OPEN/CLOSED)
    if (updateData.status) {
      dataToUpdate.status = updateData.status;
    }

    const budgetRound = await prisma.budgetRound.update({
      where: { id: Number(id) }, // แปลง id เป็น Number เพื่อความชัวร์
      data: dataToUpdate,
    });

    return NextResponse.json({ message: 'อัพเดทรอบงบประมาณสำเร็จ', budgetRound }, { status: 200 });
  } catch (error) {
    console.error('Error updating budget round:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการอัพเดทรอบงบประมาณ' }, { status: 500 });
  }
}

// DELETE - ลบรอบงบประมาณ (เหมือนเดิม)
export async function DELETE(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    if (!user || user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'กรุณาระบุ ID' }, { status: 400 });

    await prisma.budgetRound.update({
      where: { id: parseInt(id) },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ message: 'ลบรอบงบประมาณสำเร็จ' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting budget round:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการลบ' }, { status: 500 });
  }
}