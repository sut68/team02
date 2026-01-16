// app/api/job/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import jwt from 'jsonwebtoken';
import path from 'path';
import { promises as fs } from 'fs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// --- Helper Functions (Duplicated from api/job/route.ts to ensure standalone functionality) ---

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

async function getOrCreateJobType(jobType: string | null): Promise<number | null> {
  if (!jobType || jobType === 'Select Type') return null;
  const mapping: Record<string, 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP'> = {
    'Full-time': 'FULL_TIME',
    'Part-time': 'PART_TIME',
    'Contract': 'CONTRACT',
    'Internship': 'INTERNSHIP',
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

function mapEducationLevel(education: string | null) {
  if (!education || education === 'Select Education') return null;
  const mapping: Record<string, 'BELOW_BACHELOR' | 'BACHELOR' | 'MASTER' | 'DOCTORATE' | 'OTHER'> = {
    'ต่ำกว่าปริญญาตรี': 'BELOW_BACHELOR',
    'ปริญญาตรี': 'BACHELOR',
    'ปริญญาโท': 'MASTER',
    'ปริญญาเอก': 'DOCTORATE',
    'อื่นๆ': 'OTHER',
  };
  return mapping[education] || null;
}

// --- API Methods ---

// GET /api/job/[id] - Get job detail
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const jobId = parseInt(id);
    const user = getUserFromToken(req); // Check login

    if (isNaN(jobId)) {
      return NextResponse.json({ error: 'Job ID ไม่ถูกต้อง' }, { status: 400 });
    }

    const job = await prisma.jobPosting.findUnique({
      where: { id: jobId },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        jobType: true,
        company: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลงาน' }, { status: 404 });
    }

    // Logic: ให้ดูได้ถ้า Approved หรือ เป็นเจ้าของโพสต์
    const isOwner = user && user.userId === job.userId;
    if (job.status !== 'APPROVED' && !isOwner) {
      return NextResponse.json({ error: 'คุณไม่มีสิทธิ์เข้าถึงประกาศนี้' }, { status: 403 });
    }

    return NextResponse.json({ job });
  } catch (error) {
    console.error('Error fetching job:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลงาน' }, { status: 500 });
  }
}

// PATCH /api/job/[id] - Edit job (Owner only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getUserFromToken(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const jobId = parseInt(id);

    // 1. Check ownership
    const existingJob = await prisma.jobPosting.findUnique({
      where: { id: jobId },
      include: { company: true, user: true }
    });

    if (!existingJob) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลงาน' }, { status: 404 });
    }

    console.log('🔒 Ownership check:', {
      jobId,
      jobOwnerId: existingJob.userId,
      jobOwnerName: existingJob.user?.fullName,
      currentUserId: user.userId,
      currentUserEmail: user.email,
      isOwner: existingJob.userId === user.userId
    });

    if (existingJob.userId !== user.userId) {
      console.error('❌ Permission denied: User', user.userId, 'tried to edit job', jobId, 'owned by', existingJob.userId);
      return NextResponse.json({
        error: 'คุณไม่มีสิทธิ์แก้ไขประกาศนี้',
        details: `งานนี้ถูกสร้างโดย ${existingJob.user?.fullName || 'ผู้ใช้อื่น'}`
      }, { status: 403 });
    }

    // 2. Process FormData
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
    const qualifications = formData.get('qualifications') as string | null;

    // Parse numpositions
    let numpositions: number | null = null;
    if (positions && positions.trim() !== '') {
      const parsed = parseInt(positions.trim(), 10);
      if (!isNaN(parsed) && parsed > 0) numpositions = parsed;
    }

    // Get files
    const attachmentFile = formData.get('attachment') as File | null;
    const logoFile = formData.get('logo') as File | null;
    const imageFile = formData.get('image') as File | null;

    // Get removal flags
    const removeAttachment = formData.get('removeAttachment') === 'true';
    const removeLogo = formData.get('removeLogo') === 'true';
    const removeImage = formData.get('removeImage') === 'true';

    // Upload new files if provided
    const attachmentUrl = attachmentFile ? await uploadFile(attachmentFile, 'jobs') : undefined;
    const logoUrl = logoFile ? await uploadFile(logoFile, 'publish') : undefined;
    const imageUrl = imageFile ? await uploadFile(imageFile, 'publish') : undefined;

    // Get JobType ID
    const jobtypeId = await getOrCreateJobType(jobType);
    const educationLevel = mapEducationLevel(education);

    // 3. Update JobPosting
    const updateData: any = {
      title: jobTitle?.trim(),
      namejob: title?.trim() || jobTitle?.trim(),
      position: position?.trim() || null,
      qualification: qualifications?.trim() || null,
      location: address?.trim() || null,
      salarydetail: salary?.trim() || null,
      contactInfo: contact?.trim() || null,
      numpositions: numpositions,
      educationlevel: educationLevel,
      jobtypeId: jobtypeId,
    };

    // Only update JobPosterPath if a new file was uploaded or removal requested
    if (attachmentUrl) {
      updateData.JobPosterPath = attachmentUrl;
    } else if (removeAttachment) {
      updateData.JobPosterPath = null;
    }

    console.log('📝 Updating job posting:', {
      jobId,
      userId: user.userId,
      updateData: {
        ...updateData,
        jobtypeId,
        educationLevel
      }
    });

    await prisma.jobPosting.update({
      where: { id: jobId },
      data: updateData,
    });

    console.log('✅ Job posting updated successfully');

    // 4. Update Company
    if (existingJob.company || companyName) {
      const companyUpdateData: any = {
        companyname: companyName?.trim() || null,
        companyaddress: address?.trim() || null,
      };

      // Only update logo/image if new files were uploaded or removal requested
      if (logoUrl) {
        companyUpdateData.CompanyLogoPath = logoUrl;
      } else if (removeLogo) {
        companyUpdateData.CompanyLogoPath = null;
      }

      if (imageUrl) {
        companyUpdateData.CompanyPicturePath = imageUrl;
      } else if (removeImage) {
        companyUpdateData.CompanyPicturePath = null;
      }

      console.log('🏢 Updating company:', companyUpdateData);

      if (existingJob.company) {
        await prisma.company.update({
          where: { id: existingJob.company.id },
          data: companyUpdateData,
        });
        console.log('✅ Company updated');
      } else {
        // Create company if it didn't exist before but added now
        await prisma.company.create({
          data: {
            ...companyUpdateData,
            jobId: jobId,
          }
        });
        console.log('✅ Company created');
      }
    }

    return NextResponse.json({
      message: 'แก้ไขประกาศงานสำเร็จ!',
      success: true
    });

  } catch (error: any) {
    console.error('❌ Error updating job:', error);
    console.error('Stack trace:', error.stack);
    return NextResponse.json({
      error: 'เกิดข้อผิดพลาดในการแก้ไขประกาศงาน',
      details: error.message
    }, { status: 500 });
  }
}

// DELETE /api/job/[id] - Delete job (Owner only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getUserFromToken(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const jobId = parseInt(id);

    // 1. Check ownership
    const existingJob = await prisma.jobPosting.findUnique({
      where: { id: jobId },
      include: { user: true }
    });

    if (!existingJob) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลงาน' }, { status: 404 });
    }

    if (existingJob.userId !== user.userId) {
      return NextResponse.json({
        error: 'คุณไม่มีสิทธิ์ลบประกาศนี้',
        details: 'คุณไม่ใช่เจ้าของประกาศงานนี้'
      }, { status: 403 });
    }

    // 2. Delete
    await prisma.jobPosting.delete({
      where: { id: jobId }
    });

    return NextResponse.json({
      message: 'ลบประกาศงานสำเร็จ!',
      success: true
    });

  } catch (error: any) {
    console.error('❌ Error deleting job:', error);
    return NextResponse.json({
      error: 'เกิดข้อผิดพลาดในการลบประกาศงาน',
      details: error.message
    }, { status: 500 });
  }
}