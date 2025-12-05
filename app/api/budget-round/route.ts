import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

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
    const body = await request.json();
    const {
      roundName,
      fiscalYear,
      totalBudget,
      startDate,
      endDate,
      creatorId,
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
        creatorId,
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
