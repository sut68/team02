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
        budgetDonations: { 
          where: { status: 'SUCCESS' },
          select: { amount: true } 
        },
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

// PUT - อัปเดตข้อมูลและคำนวณสถานะใหม่ (Type-safe version)
export async function PUT(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { id, isPublished, ...updateData } = body;

    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const roundId = Number(id);

    // 1. ดึงข้อมูลเก่ามาก่อน
    const existingRound = await prisma.budgetRound.findUnique({
      where: { id: roundId },
    });

    if (!existingRound) {
      return NextResponse.json({ error: 'Budget round not found' }, { status: 404 });
    }

    // 2. กำหนด Type ของ dataToUpdate ให้ชัดเจน เพื่อป้องกันการส่งค่าผิดประเภท
    const dataToUpdate: {
      roundName?: string;
      fiscalYear?: string;
      totalBudget?: number;
      startDate?: Date;
      endDate?: Date;
      isPublished?: boolean;
      status?: 'PREPARING' | 'OPEN' | 'CLOSED';
    } = {};

    // อัปเดตข้อมูลทั่วไป
    if (updateData.roundName) dataToUpdate.roundName = updateData.roundName;
    if (updateData.fiscalYear) dataToUpdate.fiscalYear = updateData.fiscalYear.toString();
    
    if (updateData.totalBudget !== undefined && updateData.totalBudget !== null) {
        dataToUpdate.totalBudget = parseFloat(updateData.totalBudget.toString());
    }

    // 3. เตรียมข้อมูลสำหรับคำนวณ Status (ใช้ค่าใหม่ถ้ามี ถ้าไม่มีใช้ค่าเดิม)
    // ใช้ existingRound.startDate (Date | null) ถ้าไม่มีการส่งค่าใหม่มา
    const newStartDate = updateData.startDate ? new Date(updateData.startDate) : existingRound.startDate;
    const newEndDate = updateData.endDate ? new Date(updateData.endDate) : existingRound.endDate;
    const newIsPublished = (typeof isPublished === 'boolean') ? isPublished : existingRound.isPublished;

    // ใส่ข้อมูลวันที่และ isPublished ลงใน dataToUpdate
    if (updateData.startDate) dataToUpdate.startDate = newStartDate || undefined;
    if (updateData.endDate) dataToUpdate.endDate = newEndDate || undefined;
    if (typeof isPublished === 'boolean') dataToUpdate.isPublished = newIsPublished;

    // 4. คำนวณ Status ตาม Logic
    let newStatus: 'PREPARING' | 'OPEN' | 'CLOSED' = 'PREPARING';
    const now = new Date();

    if (!newIsPublished) {
      // ถ้ายังไม่ Publish -> PREPARING เสมอ
      newStatus = 'PREPARING';
    } else {
      // ถ้า Publish แล้ว ต้องเช็คว่ามีวันที่ครบหรือไม่
      if (newStartDate && newEndDate) {
        if (now < newStartDate) {
          newStatus = 'PREPARING';
        } else if (now > newEndDate) {
          newStatus = 'CLOSED';
        } else {
          newStatus = 'OPEN';
        }
      } else {
        // กรณี Publish แต่ไม่มีวันที่ (Data inconsistency) ให้ fallback เป็น PREPARING
        newStatus = 'PREPARING';
      }
    }
    dataToUpdate.status = newStatus;
    const budgetRound = await prisma.budgetRound.update({
      where: { id: roundId },
      data: dataToUpdate,
    });

    return NextResponse.json({ message: 'Update success', budgetRound }, { status: 200 });
  } catch (error) {
    console.error('Update BudgetRound Error:', error);
    // จัดการ Error type ให้ปลอดภัย (Safe error handling)
    const errorMessage = error instanceof Error ? error.message : 'Update failed';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
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