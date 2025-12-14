import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import jwt from 'jsonwebtoken';

// ใช้ Secret ตัวเดียวกับ Login
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

// Logic คำนวณสถานะ
function calculateStatus(round: any) {
  const now = new Date();
  const start = new Date(round.startDate);
  const end = new Date(round.endDate);

  if (!round.isPublished) return 'PREPARING';
  if (now < start) return 'PREPARING'; 
  if (now > end) return 'CLOSED';
  return 'OPEN';
}

// GET
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

    const roundsWithStats = budgetRounds.map(round => {
      // แปลงเป็น Number เพื่อความชัวร์ในการคำนวณ
      const totalRequested = round.proposals.reduce((sum, p) => sum + (Number(p.requestedAmount) || 0), 0);
      const totalDonated = round.budgetDonations.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
      const realStatus = calculateStatus(round);

      return {
        ...round,
        status: realStatus,
        stats: {
          totalProposals: round.proposals.length,
          totalRequested,
          totalDonated,
          remaining: (Number(round.totalBudget) || 0) - totalRequested,
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
    const totalBudgetFloat = totalBudget ? parseFloat(totalBudget.toString()) : 0;

    const budgetRound = await prisma.budgetRound.create({
      data: {
        roundName,
        fiscalYear: fiscalYear.toString(),
        totalBudget: totalBudgetFloat, // ส่งค่าที่เป็นตัวเลขไป
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : new Date(),
        creatorId: Number(user.userId),
        isPublished: isPublished || false, 
        status: 'PREPARING' 
      },
    });

    return NextResponse.json({ message: 'Success', budgetRound }, { status: 201 });
  } catch (error) {
    // Log Error เพื่อให้เห็นปัญหาชัดเจนใน Terminal
    console.error('Create BudgetRound Error:', error);
    // ส่ง Error Message กลับไปให้ Frontend รู้ด้วย (cast error as any เพื่อดึง message)
    return NextResponse.json({ error: (error as any).message || 'Creation failed' }, { status: 500 });
  }
}

// PUT
export async function PUT(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { id, isPublished, ...updateData } = body;

    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const dataToUpdate: any = {};

    if (updateData.roundName) dataToUpdate.roundName = updateData.roundName;
    if (updateData.fiscalYear) dataToUpdate.fiscalYear = updateData.fiscalYear.toString();

    if (updateData.totalBudget !== undefined) {
        dataToUpdate.totalBudget = parseFloat(updateData.totalBudget.toString());
    }

    if (updateData.startDate) dataToUpdate.startDate = new Date(updateData.startDate);
    if (updateData.endDate) dataToUpdate.endDate = new Date(updateData.endDate);

    if (typeof isPublished === 'boolean') {
      dataToUpdate.isPublished = isPublished;
    }

    const budgetRound = await prisma.budgetRound.update({
      where: { id: Number(id) },
      data: dataToUpdate,
    });

    return NextResponse.json({ message: 'Update success', budgetRound }, { status: 200 });
  } catch (error) {
    console.error('Update BudgetRound Error:', error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

// DELETE
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
    console.error('Delete BudgetRound Error:', error);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}