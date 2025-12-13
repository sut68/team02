import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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

// ✅ Logic คำนวณสถานะ (สำคัญที่สุด)
function calculateStatus(round: any) {
  const now = new Date();
  const start = new Date(round.startDate);
  const end = new Date(round.endDate);

  // 1. ถ้ายังไม่กด Publish (ฉบับร่าง) -> PREPARING เสมอ
  if (!round.isPublished) {
    return 'PREPARING';
  }

  // 2. ถ้า Publish แล้ว แต่ยังไม่ถึงเวลาเริ่ม -> PREPARING
  if (now < start) {
    return 'PREPARING'; 
  }

  // 3. ถ้าเลยเวลาจบแล้ว -> CLOSED
  if (now > end) {
    return 'CLOSED';
  }

  // 4. ถ้าอยู่ในช่วงเวลา -> OPEN
  return 'OPEN';
}

// GET - ดึงข้อมูล
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
        creator: { select: { id: true, fullName: true, email: true } },
        proposals: {
          where: { deletedAt: null },
          select: { id: true, projectName: true, status: true, requestedAmount: true },
        },
        budgetDonations: { select: { amount: true } },
      },
      orderBy: [{ startDate: 'desc' }]
    });

    // Map ข้อมูลเพื่อใส่ Calculated Status
    const roundsWithStats = budgetRounds.map(round => {
      const totalRequested = round.proposals.reduce((sum, p) => sum + (p.requestedAmount || 0), 0);
      const totalDonated = round.budgetDonations.reduce((sum, d) => sum + d.amount, 0);

      // ✅ ใช้ function คำนวณสถานะ แทนการดึงจาก DB ตรงๆ
      const realStatus = calculateStatus(round);

      return {
        ...round,
        status: realStatus, // Override ค่า status เดิม
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
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

// POST - สร้างรอบใหม่
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const body = await request.json();
    const { roundName, fiscalYear, totalBudget, startDate, endDate, isPublished } = body;

    if (!roundName) return NextResponse.json({ error: 'Missing roundName' }, { status: 400 });

    const budgetRound = await prisma.budgetRound.create({
      data: {
        roundName,
        fiscalYear,
        totalBudget: totalBudget || 0,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : new Date(),
        creatorId: user.userId,
        // ✅ สร้างมาเป็น Draft ก่อนเสมอ (false) หรือตามที่ส่งมา
        isPublished: isPublished || false, 
        status: 'PREPARING' // ค่า Default ใน DB ใส่ไว้เฉยๆ
      },
    });

    return NextResponse.json({ message: 'Success', budgetRound }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Creation failed' }, { status: 500 });
  }
}

// PUT - แก้ไข (รวมถึงการ Toggle Publish)
export async function PUT(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { id, isPublished, ...updateData } = body;

    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const dataToUpdate: any = {
      roundName: updateData.roundName,
      fiscalYear: updateData.fiscalYear,
      totalBudget: updateData.totalBudget,
    };

    if (updateData.startDate) dataToUpdate.startDate = new Date(updateData.startDate);
    if (updateData.endDate) dataToUpdate.endDate = new Date(updateData.endDate);

    // ✅ อัปเดตสถานะ Publish (Safety Switch)
    if (typeof isPublished === 'boolean') {
      dataToUpdate.isPublished = isPublished;
    }

    const budgetRound = await prisma.budgetRound.update({
      where: { id: Number(id) },
      data: dataToUpdate,
    });

    return NextResponse.json({ message: 'Update success', budgetRound }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

// DELETE (ใช้เหมือนเดิม)
export async function DELETE(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    await prisma.budgetRound.update({
      where: { id: parseInt(id) },
      data: { deletedAt: new Date() },
    });
    return NextResponse.json({ message: 'Deleted' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}