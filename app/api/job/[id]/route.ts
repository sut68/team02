import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// GET /api/job/[id] - Get single approved job (public)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const jobId = parseInt(id);
    
    if (isNaN(jobId)) {
      return NextResponse.json(
        { error: 'Job ID ไม่ถูกต้อง' },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลงาน' },
        { status: 404 }
      );
    }

    // Only return approved jobs for public access
    if (job.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'งานนี้ยังไม่ได้รับการอนุมัติ' },
        { status: 403 }
      );
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

