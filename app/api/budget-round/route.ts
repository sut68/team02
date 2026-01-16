import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import jwt from 'jsonwebtoken';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// --- Config Day.js ---
dayjs.extend(utc);
dayjs.extend(timezone);
const TIMEZONE = 'Asia/Bangkok';

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

// Logic คำนวณสถานะ (แก้ไขให้ใช้ dayjs)
function calculateStatus(round: any) {
  if (!round.isPublished) return 'PREPARING';
  if (!round.startDate || !round.endDate) return 'PREPARING';

  const now = dayjs().tz(TIMEZONE);
  const start = dayjs(round.startDate).tz(TIMEZONE);
  const end = dayjs(round.endDate).tz(TIMEZONE);

  if (now.isBefore(start)) return 'PREPARING'; 
  if (now.isAfter(end)) return 'CLOSED';
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
      // เรียงจาก "เก่า -> ใหม่" เพื่อคำนวณการส่งต่อยอดเงิน
      orderBy: [{ startDate: 'asc' }] 
    });

    // ตัวแปรสำหรับเก็บยอดเงินคงเหลือที่จะส่งต่อไปรอบถัดไป
    let accumulatedCarryOver = 0;

    const roundsWithStats = budgetRounds.map(round => {
      // 1. คำนวณยอดขอใช้ (Requested) และยอดบริจาค (Donated)
      const totalRequested = round.proposals
            .filter(p => p.status === 'APPROVED' || p.status === 'OPEN') // เช็คสถานะก่อน
            .reduce((sum, p) => sum + (Number(p.requestedAmount) || 0), 0);
      const totalDonated = round.budgetDonations.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
      const realStatus = calculateStatus(round);
      
      // A. เงินตั้งต้นของรอบนี้ = เงินที่เหลือจากรอบที่ผ่านมา
      const startingBudget = accumulatedCarryOver;

      // B. เงินรวมทั้งหมดที่มีให้ใช้ = เงินตั้งต้น (จากรอบก่อน) + เงินบริจาค (ของรอบนี้)
      const totalAvailable = startingBudget + totalDonated;

      // C. คำนวณคงเหลือสุทธิ (เงินที่มี - เงินที่ขอใช้)
      const remaining = totalAvailable - totalRequested;

      // D. เก็บยอดคงเหลือไว้ส่งต่อไปเป็น "เงินตั้งต้น" ของรอบถัดไป (ถ้าเหลือ > 0)
      accumulatedCarryOver = remaining > 0 ? remaining : 0; 

      return {
        ...round,
        status: realStatus,
        stats: {
          totalProposals: round.proposals.length,
          totalRequested,
          totalDonated,
          startingBudget: startingBudget, // เงินตั้งต้น (มาจากรอบก่อน)
          totalAvailable: totalAvailable, // เงินรวมทั้งหมดที่มีให้ใช้
          remaining: remaining,           // เงินคงเหลือ (จะถูกส่งต่อไปรอบหน้า)
        },
      };
    });

    // เรียงข้อมูลกลับเป็น "ใหม่ -> เก่า" เพื่อให้หน้าเว็บแสดงรอบล่าสุดก่อน
    const sortedRounds = roundsWithStats.reverse();

    return NextResponse.json({ budgetRounds: sortedRounds }, { status: 200 });
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

    // แปลงวันที่โดยอิง Timezone (ถ้าจำเป็น) หรือใช้ Date object ปกติแล้วให้ calculateStatus จัดการตอน display
    // แต่เพื่อความชัวร์ในการบันทึก แนะนำให้ parse ด้วย dayjs แล้ว .toDate()
    const start = startDate ? dayjs.tz(startDate, TIMEZONE).startOf('day').toDate() : new Date();
    const end = endDate ? dayjs.tz(endDate, TIMEZONE).endOf('day').toDate() : new Date();

    const budgetRound = await prisma.budgetRound.create({
      data: {
        roundName,
        fiscalYear: fiscalYear.toString(),
        totalBudget: totalBudgetFloat,
        startDate: start,
        endDate: end,
        creatorId: Number(user.userId),
        isPublished: isPublished || false, 
        status: 'PREPARING' 
      },
    });

    return NextResponse.json({ message: 'Success', budgetRound }, { status: 201 });
  } catch (error) {
    console.error('Create BudgetRound Error:', error);
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

    // 2. กำหนด Type ของ dataToUpdate
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

    // 3. เตรียมข้อมูลสำหรับคำนวณ Status
    // ใช้ dayjs ในการจัดการวันที่รับเข้ามาเพื่อให้ได้ Timezone ที่ถูกต้อง
    let newStartDate = existingRound.startDate;
    let newEndDate = existingRound.endDate;

    if (updateData.startDate) {
        newStartDate = dayjs.tz(updateData.startDate, TIMEZONE).startOf('day').toDate();
        dataToUpdate.startDate = newStartDate;
    }
    if (updateData.endDate) {
        newEndDate = dayjs.tz(updateData.endDate, TIMEZONE).endOf('day').toDate();
        dataToUpdate.endDate = newEndDate;
    }

    const newIsPublished = (typeof isPublished === 'boolean') ? isPublished : existingRound.isPublished;
    if (typeof isPublished === 'boolean') dataToUpdate.isPublished = newIsPublished;

    // 4. คำนวณ Status ตาม Logic (ใช้ Dayjs เปรียบเทียบ)
    let newStatus: 'PREPARING' | 'OPEN' | 'CLOSED' = 'PREPARING';
    const now = dayjs().tz(TIMEZONE); // เวลาปัจจุบันในไทย

    if (!newIsPublished) {
      // ถ้ายังไม่ Publish -> PREPARING เสมอ
      newStatus = 'PREPARING';
    } else {
      // ถ้า Publish แล้ว ต้องเช็คว่ามีวันที่ครบหรือไม่
      if (newStartDate && newEndDate) {
        const start = dayjs(newStartDate).tz(TIMEZONE);
        const end = dayjs(newEndDate).tz(TIMEZONE);

        if (now.isBefore(start)) {
          newStatus = 'PREPARING';
        } else if (now.isAfter(end)) {
          newStatus = 'CLOSED';
        } else {
          newStatus = 'OPEN';
        }
      } else {
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