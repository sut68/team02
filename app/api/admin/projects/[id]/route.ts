// app/api/admin/projects/[id]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/app/lib/prisma';
// import { getServerSession } from 'next-auth'; // 💡 สำหรับตรวจสอบสิทธิ์ Admin

// 💡 (สมมติว่าคุณได้ตั้งค่า next-auth และ Session Options แล้ว)
// import { authOptions } from '@/app/lib/auth';

// GET /api/admin/projects/[id]
// ดึงรายละเอียดโครงการเดียว (Admin/Edit View)
export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  // 💡 TODO: ตรวจสอบสิทธิ์ Admin
  /*
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
  }
  */
  const params = await props.params;
  // robust parsing: prefer params.id, but fallback to parsing request URL if missing
  let projectId = NaN;
  if (params?.id) {
    projectId = parseInt(String(params.id), 10);
  }
  if (Number.isNaN(projectId)) {
    // debug help in dev
    console.warn('GET /api/admin/projects/[id] - params.id invalid, attempting fallback', { params, url: request.url, nextUrl: (request as any)?.nextUrl });
    try {
      const url = request.url || (request as any).nextUrl?.pathname || '';
      const m = String(url).match(/\/api\/admin\/projects\/([^\/\?]+)/);
      if (m && m[1]) projectId = parseInt(m[1], 10);
    } catch (e) {
      /* ignore fallback errors */
    }
  }

  if (isNaN(projectId)) {
    return NextResponse.json(
      { error: 'Project ID ไม่ถูกต้อง' },
      { status: 400 }
    );
  }

  try {
    const project = await prisma.donationProject.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        title: true,
        description: true,
        goalAmount: true,
        currentAmount: true,
        startDate: true,
        endDate: true,
        ownerName: true,
        contact: true,
        posterUrl: true,
        status: true,
        createdAt: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'ไม่พบโครงการที่คุณร้องขอ' },
        { status: 404 }
      );
    }

    return NextResponse.json(project, { status: 200 });
  } catch (error) {
    console.error(`Error fetching project ${projectId} for admin:`, error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลโครงการ' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/projects/[id]
// แก้ไขข้อมูลโครงการ (Admin Only)
export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  // 💡 TODO: ตรวจสอบสิทธิ์ Admin
  /*
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
  }
  */
  const params = await props.params;
  let projectId = NaN;
  if (params?.id) {
    projectId = parseInt(String(params.id), 10);
  }
  if (Number.isNaN(projectId)) {
    console.warn('PATCH /api/admin/projects/[id] - params.id invalid, attempting fallback', { params, url: request.url, nextUrl: (request as any)?.nextUrl });
    try {
      const url = request.url || (request as any).nextUrl?.pathname || '';
      const m = String(url).match(/\/api\/admin\/projects\/([^\/\?]+)/);
      if (m && m[1]) projectId = parseInt(m[1], 10);
    } catch (e) { /* ignore */ }
  }

  if (isNaN(projectId)) {
    return NextResponse.json({ error: 'Project ID ไม่ถูกต้อง' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const updateData: { [key: string]: any } = {};

    // กรองและแปลงข้อมูล
    if (body.title) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    // 💡 Ensure we handle numeric or string goalAmount reliably
    if (body.goalAmount !== undefined && body.goalAmount !== null) {
      const parsed = parseFloat(String(body.goalAmount));
      if (!Number.isNaN(parsed)) updateData.goalAmount = parsed;
    }
    if (body.startDate) updateData.startDate = new Date(body.startDate);
    if (body.endDate) updateData.endDate = new Date(body.endDate);
    if (body.ownerName) updateData.ownerName = body.ownerName;
    if (body.contact) updateData.contact = body.contact;
    if (body.posterUrl !== undefined) updateData.posterUrl = body.posterUrl;
    if (body.status) updateData.status = body.status; // สามารถเปลี่ยนสถานะ (OPEN/CLOSED/COMPLETED)

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'ไม่มีข้อมูลสำหรับการแก้ไข' }, { status: 400 });
    }

    const updatedProject = await prisma.donationProject.update({
      where: { id: projectId },
      data: updateData,
    });

    return NextResponse.json(updatedProject, { status: 200 });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการแก้ไขโครงการ' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/projects/[id]
// ลบโครงการ (Admin Only)
export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }) {
  // 💡 TODO: ตรวจสอบสิทธิ์ Admin
  /*
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
  }
  */
  const params = await props.params;
  let projectId = NaN;
  if (params?.id) {
    projectId = parseInt(String(params.id), 10);
  }
  if (Number.isNaN(projectId)) {
    console.warn('DELETE /api/admin/projects/[id] - params.id invalid, attempting fallback', { params, url: request.url, nextUrl: (request as any)?.nextUrl });
    try {
      const url = request.url || (request as any).nextUrl?.pathname || '';
      const m = String(url).match(/\/api\/admin\/projects\/([^\/\?]+)/);
      if (m && m[1]) projectId = parseInt(m[1], 10);
    } catch (e) { /* ignore */ }
  }

  if (isNaN(projectId)) {
    return NextResponse.json({ error: 'Project ID ไม่ถูกต้อง' }, { status: 400 });
  }

  try {
    // ลบโครงการ
    await prisma.donationProject.delete({
      where: { id: projectId },
    });

    return NextResponse.json({ message: 'โครงการถูกลบเรียบร้อยแล้ว' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบโครงการ' },
      { status: 500 }
    );
  }
}