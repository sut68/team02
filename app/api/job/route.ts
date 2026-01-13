import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import jwt from 'jsonwebtoken';
import path from 'path';
import { promises as fs } from 'fs';

export const dynamic = 'force-dynamic';
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

// Helper function to upload file
async function uploadFile(file: File, folder: string): Promise<string | null> {
  if (!file || file.size === 0) return null;

  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder);
    await fs.mkdir(uploadDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const safeName = file.name.replace(/\s+/g, '_');
    const fileNameOnDisk = `${Date.now()}_${safeName}`;
    const filePathOnDisk = path.join(uploadDir, fileNameOnDisk);
    const publicPath = `/uploads/${folder}/${fileNameOnDisk}`;

    await fs.writeFile(filePathOnDisk, buffer);
    return publicPath;
  } catch (error) {
    console.error('File upload error:', error);
    return null;
  }
}

// Get or create JobType
async function getOrCreateJobType(
  jobType: string | null
): Promise<number | null> {
  if (!jobType || jobType === 'Select Type') return null;

  const mapping: Record<
    string,
    'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP'
  > = {
    'Full-time': 'FULL_TIME',
    'Part-time': 'PART_TIME',
    Contract: 'CONTRACT',
    Internship: 'INTERNSHIP',
  };

  const typename = mapping[jobType];
  if (!typename) return null;

  const jobTypeRecord = await prisma.jobType.upsert({
    where: { typename },
    update: {},
    create: { typename },
  });

  return jobTypeRecord.id;
}

function mapEducationLevel(
  education: string | null
): 'BELOW_BACHELOR' | 'BACHELOR' | 'MASTER' | 'DOCTORATE' | 'OTHER' | null {
  if (!education || education === 'Select Education') return null;
  const mapping: Record<
    string,
    'BELOW_BACHELOR' | 'BACHELOR' | 'MASTER' | 'DOCTORATE' | 'OTHER'
  > = {
    ต่ำกว่าปริญญาตรี: 'BELOW_BACHELOR',
    ปริญญาตรี: 'BACHELOR',
    ปริญญาโท: 'MASTER',
    ปริญญาเอก: 'DOCTORATE',
    อื่นๆ: 'OTHER',
  };
  return mapping[education] || null;
}

// --------------------------------------------------------------------------
// POST API (ต้องมี export)
// --------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const user = getUserFromToken(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();

    // Get text fields
    const jobTitle = formData.get('jobTitle') as string | null;
    const title = formData.get('title') as string | null;
    const position = formData.get('position') as string | null;
    const jobType = formData.get('jobType') as string | null;
    const education = formData.get('education') as string | null;
    const salary = formData.get('salary') as string | null;
    const companyName = formData.get('companyName') as string | null;
    const positions = formData.get('positions') as string | null;
    const address = formData.get('address') as string | null;
    const contact = formData.get('contact') as string | null;
    // const transportation = formData.get('transportation') as string | null; // Unused
    const qualifications = formData.get('qualifications') as string | null;

    // Validate required field
    if (!jobTitle || jobTitle.trim() === '') {
      return NextResponse.json(
        { error: 'กรุณาระบุชื่อหัวข้อของงาน' },
        { status: 400 }
      );
    }

    // Parse numpositions safely
    let numpositions: number | null = null;
    if (positions && positions.trim() !== '') {
      const parsed = parseInt(positions.trim(), 10);
      if (!isNaN(parsed) && parsed > 0) {
        numpositions = parsed;
      }
    }

    // Get files
    const attachmentFile = formData.get('attachment') as File | null;
    const logoFile = formData.get('logo') as File | null;
    const imageFile = formData.get('image') as File | null;

    // Upload files
    const attachmentUrl = attachmentFile
      ? await uploadFile(attachmentFile, 'jobs')
      : null;
    const logoUrl = logoFile ? await uploadFile(logoFile, 'publish') : null;
    const imageUrl = imageFile ? await uploadFile(imageFile, 'publish') : null;

    // Get or create JobType
    const jobtypeId = await getOrCreateJobType(jobType);

    // Create JobPosting record
    const jobPosting = await prisma.jobPosting.create({
      data: {
        title: jobTitle.trim(),
        namejob: title?.trim() || jobTitle.trim(),
        position: position?.trim() || null,
        qualification: qualifications?.trim() || null,
        location: address?.trim() || null,
        salarydetail: salary?.trim() || null,
        numpositions,
        contactInfo: contact?.trim() || null,
        JobPosterPath: attachmentUrl,
        educationlevel: mapEducationLevel(education),
        status: 'PENDING',
        userId: user.userId,
        jobtypeId,
      },
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

    // Create Company record if company info provided
    if (companyName || logoUrl || imageUrl) {
      await prisma.company.create({
        data: {
          companyname: companyName?.trim() || '',
          companyaddress: address?.trim() || null,
          CompanyLogoPath: logoUrl,
          CompanyPicturePath: imageUrl,
          jobId: jobPosting.id,
        },
      });
    }

    // Fetch the complete job with company
    const job = await prisma.jobPosting.findUnique({
      where: { id: jobPosting.id },
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

    return NextResponse.json(
      { message: 'บันทึกประกาศงานสำเร็จ!', job },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating job:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสร้างประกาศงาน' },
      { status: 500 }
    );
  }
}

// --------------------------------------------------------------------------
// GET API (ต้องมี export)
// --------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const [jobs, total] = await Promise.all([
      prisma.jobPosting.findMany({
        where: {
          status: 'APPROVED',
        },
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
        skip,
        take: limit,
      }),
      prisma.jobPosting.count({
        where: {
          status: 'APPROVED',
        },
      }),
    ]);

    return NextResponse.json({
      jobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลงาน', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}