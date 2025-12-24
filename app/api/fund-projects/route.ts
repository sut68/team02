// app/api/projects/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
// import { getServerSession } from 'next-auth'; // 💡 สำหรับตรวจสอบสิทธิ์ Admin

// --------------------------------------------------------------------------
// 💡 NOTE: เราตัด Logic Helpers (normKey, pickField, etc.) ออก
// 💡 เนื่องจากเราเชื่อมั่นว่า Prisma Client ใช้ camelCase
// --------------------------------------------------------------------------

// GET /api/projects
// ดึงรายการโครงการระดมทุนทั้งหมดที่เปิดรับอยู่
export async function GET() {
  try {
    // 💡 ใช้ prisma.donationProject (สมมติว่าเป็นชื่อที่ถูกต้องหลัง generate)
    const projects = await prisma.donationProject.findMany({
      where: {
        status: 'OPEN',
      },
      select: {
        id: true,
        title: true,
        description: true,
        goalAmount: true, // camelCase
        currentAmount: true, // camelCase
        posterUrl: true, // camelCase
        startDate: true, // camelCase
        endDate: true, // camelCase
        ownerName: true, // camelCase
        contact: true,
        status: true,
        createdAt: true, // camelCase
      },
      orderBy: {
        createdAt: 'desc', // ใช้ orderBy ได้เลย เพราะมั่นใจชื่อฟิลด์
      },
    });

    if (projects.length === 0) {
      return NextResponse.json({ message: 'ไม่พบโครงการระดมทุน' }, { status: 200 });
    }

    return NextResponse.json(projects, { status: 200 });
  } catch (error) {
    console.error('Error fetching donation projects:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลโครงการ' },
      { status: 500 }
    );
  }
}

// 💡 NEW API: POST /api/projects
// เพิ่มโครงการระดมทุนใหม่ (Admin Only)
export async function POST(request: Request) {
  // 💡 TODO: ตรวจสอบสิทธิ์ Admin
  /*
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
  }
  */

  try {
    const body = await request.json();
    const {
      title,
      description,
      goalAmount,
      startDate,
      endDate,
      ownerName,
      contact,
      posterUrl,
    } = body;

    // Validation ขั้นต่ำ
    if (!title || !goalAmount || !startDate || !endDate || !ownerName) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลโครงการให้ครบถ้วน (ชื่อ, เป้าหมาย, วันที่)' },
        { status: 400 }
      );
    }

    // สร้างโครงการ โดยใช้ prisma.donationProject และฟิลด์ camelCase
    const newProject = await prisma.donationProject.create({
      data: {
        title,
        description: description || '',
        goalAmount: parseFloat(goalAmount as any),
        currentAmount: 0,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        ownerName: ownerName,
        contact: contact || '',
        posterUrl: posterUrl || null,
        status: 'OPEN',
      },
    });

    // คืนค่าแบบสะอาดตา
    const simplifiedResponse = {
      id: newProject.id,
      title: newProject.title,
      goalAmount: newProject.goalAmount,
      currentAmount: newProject.currentAmount,
      startDate: newProject.startDate,
      endDate: newProject.endDate,
      ownerName: newProject.ownerName,
      status: newProject.status,
      createdAt: newProject.createdAt,
    };

    return NextResponse.json(simplifiedResponse, { status: 201 });
  } catch (error) {
    console.error('Error creating donation project:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสร้างโครงการใหม่', detail: (error as any)?.message },
      { status: 500 }
    );
  }
}