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

// GET /api/admin/job/[id] - Get single job detail (Admin only)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getUserFromToken(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is admin
  if (user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const jobId = parseInt(id);
    if (isNaN(jobId)) {
      return NextResponse.json({ error: 'Job ID ไม่ถูกต้อง' }, { status: 400 });
    }

    const job = await prisma.jobPosting.findUnique({
      where: { id: jobId },
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
    });

    if (!job) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลงาน' }, { status: 404 });
    }

    return NextResponse.json({ job });
  } catch (error) {
    console.error('Error fetching job:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลงาน' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/job/[id] - Update job status (Admin only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getUserFromToken(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is admin
  if (user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const jobId = parseInt(id);
    if (isNaN(jobId)) {
      return NextResponse.json({ error: 'Job ID ไม่ถูกต้อง' }, { status: 400 });
    }

    const body = await req.json();
    const { status } = body;

    if (!status || !['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
      return NextResponse.json({ error: 'สถานะไม่ถูกต้อง' }, { status: 400 });
    }

    // Update job status
    const job = await prisma.jobPosting.update({
      where: { id: jobId },
      data: { status },
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
    });

    // Create approval log entry
    await prisma.approvalLog.create({
      data: {
        action:
          status === 'APPROVED'
            ? 'APPROVED'
            : status === 'REJECTED'
            ? 'REJECTED'
            : 'PENDING',
        staffId: user.userId,
        jobId: job.id,
      },
    });

    return NextResponse.json({
      message: 'อัปเดตสถานะสำเร็จ',
      job,
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'ไม่พบข้อมูลงาน' }, { status: 404 });
    }
    console.error('Error updating job:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัปเดตสถานะ' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/job/[id] - Delete job (Admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getUserFromToken(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is admin
  if (user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const jobId = parseInt(id);
    if (isNaN(jobId)) {
      return NextResponse.json(
        { error: 'Job ID ไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    // Delete job (cascade will delete related Company, ApprovalLog, and JobEditHistory)
    await prisma.jobPosting.delete({
      where: { id: jobId },
    });

    return NextResponse.json({
      message: 'ลบงานสำเร็จ',
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลงาน' },
        { status: 404 }
      );
    }
    console.error('Error deleting job:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบงาน' },
      { status: 500 }
    );
  }
}
