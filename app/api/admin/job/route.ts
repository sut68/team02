import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET =
  process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

function getUserFromToken(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: number;
      email: string;
      role: string;
    };
    return decoded;
  } catch (e) {
    return null;
  }
}

// GET /api/admin/job - List all jobs with filtering (Admin only)
export async function GET(req: NextRequest) {
  const user = getUserFromToken(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is admin
  if (user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status') || 'all';

    // Build where clause
    const where: any = {};
    if (statusFilter !== 'all') {
      const statusMap: Record<string, 'PENDING' | 'APPROVED' | 'REJECTED'> = {
        pending: 'PENDING',
        approved: 'APPROVED',
        rejected: 'REJECTED',
      };
      where.status = statusMap[statusFilter] || undefined;
    }

    const jobs = await prisma.jobPosting.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        jobType: true,
        company: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate stats
    const [allCount, pendingCount, approvedCount, rejectedCount] =
      await Promise.all([
        prisma.jobPosting.count(),
        prisma.jobPosting.count({ where: { status: 'PENDING' } }),
        prisma.jobPosting.count({ where: { status: 'APPROVED' } }),
        prisma.jobPosting.count({ where: { status: 'REJECTED' } }),
      ]);

    return NextResponse.json({
      jobs,
      stats: {
        all: allCount,
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
      },
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลงาน' },
      { status: 500 }
    );
  }
}
