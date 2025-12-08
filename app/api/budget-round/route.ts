import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import jwt from 'jsonwebtoken'; // ✅ Import jwt

// ดึง Secret Key
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// ✅ ฟังก์ชัน Helper: แกะ User ID จาก Token
function getUserFromToken(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  try {
    // แกะ Token ออกมา
    return jwt.verify(token, JWT_SECRET) as { userId: number; email: string; role: string };
  } catch (e) {
    return null;
  }
}

// GET - ดึงรายการรอบงบประมาณทั้งหมด
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
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        proposals: {
          where: { deletedAt: null },
          select: {
            id: true,
            projectName: true,
            status: true,
            requestedAmount: true,
          },
        },
        budgetDonations: {
          select: {
            amount: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // คำนวณยอดรวม
    const roundsWithStats = budgetRounds.map(round => {
      const totalRequested = round.proposals.reduce(
        (sum, p) => sum + (p.requestedAmount || 0),
        0
      );
      const totalDonated = round.budgetDonations.reduce(
        (sum, d) => sum + d.amount,
        0
      );

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
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    );
  }
}

// POST - สร้างรอบงบประมาณใหม่
export async function POST(request: NextRequest) {
  try {
    // ✅ 1. ตรวจสอบตัวตนผู้ใช้งาน (Admin)
    const user = getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบก่อนทำรายการ' }, { status: 401 });
    }

    // (Optionally) เช็ค Role ว่าเป็น ADMIN หรือไม่
    if (user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'คุณไม่มีสิทธิ์ทำรายการนี้' }, { status: 403 });
    }

    const body = await request.json();
    const {
      roundName,
      fiscalYear,
      totalBudget,
      startDate,
      endDate,
      // creatorId, // ไม่ต้องรับค่านี้จาก Body แล้ว
    } = body;

    if (!roundName) {
      return NextResponse.json(
        { error: 'กรุณาระบุชื่อรอบงบประมาณ' },
        { status: 400 }
      );
    }

    const budgetRound = await prisma.budgetRound.create({
      data: {
        roundName,
        fiscalYear,
        totalBudget,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        creatorId: user.userId, 
      },
      include: {
        creator: {
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
        message: 'สร้างรอบงบประมาณสำเร็จ',
        budgetRound,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating budget round:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสร้างรอบงบประมาณ' },
      { status: 500 }
    );
  }
}

// PUT - อัพเดทรอบงบประมาณ
export async function PUT(request: NextRequest) {
  try {
    // ✅ (Optional) เช็ค Auth สำหรับการแก้ไขด้วยก็ได้
    const user = getUserFromToken(request);
    if (!user || user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'กรุณาระบุ ID ของรอบงบประมาณ' },
        { status: 400 }
      );
    }

    const budgetRound = await prisma.budgetRound.update({
      where: { id },
      data: {
        roundName: updateData.roundName,
        fiscalYear: updateData.fiscalYear,
        totalBudget: updateData.totalBudget,
        startDate: updateData.startDate ? new Date(updateData.startDate) : undefined,
        endDate: updateData.endDate ? new Date(updateData.endDate) : undefined,
      },
    });

    return NextResponse.json(
      {
        message: 'อัพเดทรอบงบประมาณสำเร็จ',
        budgetRound,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating budget round:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัพเดทรอบงบประมาณ' },
      { status: 500 }
    );
  }
}

// DELETE - ลบรอบงบประมาณ (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    // ✅ (Optional) เช็ค Auth สำหรับการลบด้วย
    const user = getUserFromToken(request);
    if (!user || user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'กรุณาระบุ ID ของรอบงบประมาณ' },
        { status: 400 }
      );
    }

    await prisma.budgetRound.update({
      where: { id: parseInt(id) },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json(
      { message: 'ลบรอบงบประมาณสำเร็จ' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting budget round:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบรอบงบประมาณ' },
      { status: 500 }
    );
  }
}