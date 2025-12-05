import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// GET - ดึงข้อมูลโครงการพร้อมรายละเอียดการบริจาค
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = parseInt(id);
    const { searchParams } = new URL(request.url);
    const includeTransactions = searchParams.get('includeTransactions') === 'true';

    const project = await prisma.donationProject.findUnique({
      where: { id: projectId },
      include: {
        transactions: includeTransactions
          ? {
              where: {
                status: 'SUCCESS',
                isPublic: true,
              },
              select: {
                id: true,
                amount: true,
                message: true,
                donorName: true,
                createdAt: true,
                user: {
                  select: {
                    fullName: true,
                  },
                },
              },
              orderBy: { createdAt: 'desc' },
            }
          : false,
        _count: {
          select: {
            transactions: {
              where: { status: 'SUCCESS' },
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'ไม่พบโครงการ' },
        { status: 404 }
      );
    }

    const projectWithStats = {
      ...project,
      progress: project.goalAmount > 0
        ? Math.min((project.currentAmount / project.goalAmount) * 100, 100)
        : 0,
      donorCount: project._count.transactions,
      daysLeft: Math.max(
        0,
        Math.ceil((new Date(project.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      ),
    };

    return NextResponse.json({ project: projectWithStats }, { status: 200 });
  } catch (error) {
    console.error('Error fetching donation project:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    );
  }
}
