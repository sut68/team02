import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// ตั้งค่า dayjs ให้รองรับ timezone
dayjs.extend(utc);
dayjs.extend(timezone);

const TIMEZONE = 'Asia/Bangkok';

// GET - ดึงรายการโครงการระดมทุน (คงเดิม ไม่ได้แก้ส่วนนี้)
export async function GET(request: NextRequest) {
  // ... (โค้ดเดิม) ...
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const filter = searchParams.get('filter');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const where: any = {};

    // 1. ถ้าส่ง status มาเจาะจง ก็กรองตามนั้น
    if (status) {
      where.status = status;
    }

    // 2. ✅ เพิ่ม Logic: ถ้าส่ง filter=active มา ให้เช็ค 3 เงื่อนไขทันที
    if (filter === 'active') {
      const now = new Date(); // เวลาปัจจุบัน (UTC)
      console.log("Filtering active projects at:", now.toISOString());
      
      where.status = 'OPEN'; // ต้องเปิด
      where.startDate = { lte: now }; // วันเริ่ม <= ตอนนี้
      where.endDate = { gte: now };   // วันจบ >= ตอนนี้
    }

    const [projects, total] = await Promise.all([
      prisma.donationProject.findMany({
        where,
        include: {
          transactions: {
            where: { status: 'SUCCESS' },
            select: {
              amount: true, createdAt: true, fullName: true, email: true, phone: true,
              postalCode: true, address: true, subdistrict: true, district: true, province: true, userId: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
          _count: { select: { transactions: { where: { status: 'SUCCESS' } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.donationProject.count({ where }),
    ]);

    const projectsWithProgress = projects.map(project => ({
      ...project,
      progress: project.goalAmount > 0
        ? Math.min((project.currentAmount / project.goalAmount) * 100, 100)
        : 0,
      donorCount: project._count.transactions,
    }));

    return NextResponse.json({
        projects: projectsWithProgress,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      }, { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching donation projects:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' }, { status: 500 });
  }
}

// POST - สร้างโครงการระดมทุนใหม่ (แก้ส่วนนี้)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title, description, goalAmount, startDate, endDate,
      isCentralFund, ownerName, contact, posterUrl,
    } = body;

    if (!title || !description || !goalAmount || !startDate || !endDate || !ownerName || !contact) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, { status: 400 });
    }

    // --- จัดการเวลาด้วย dayjs ---
    // รับค่าวันที่เข้ามา แล้ว force ให้เป็น Timezone ไทย
    // .startOf('day') จะปรับเป็น 00:00:00
    // .endOf('day') จะปรับเป็น 23:59:59.999
    
    const start = dayjs.tz(startDate, TIMEZONE).startOf('day').toDate();
    const end = dayjs.tz(endDate, TIMEZONE).endOf('day').toDate();

    const project = await prisma.donationProject.create({
      data: {
        title,
        description,
        goalAmount: parseFloat(goalAmount),
        startDate: start, // ใช้ค่าที่แปลงแล้ว
        endDate: end,     // ใช้ค่าที่แปลงแล้ว
        ownerName,
        contact,
        posterUrl,
        status: 'OPEN',
      },
    });

    return NextResponse.json({ message: 'สร้างโครงการระดมทุนสำเร็จ', project }, { status: 201 });
  } catch (error) {
    console.error('Error creating donation project:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการสร้างโครงการ' }, { status: 500 });
  }
}

// PUT - อัพเดทโครงการระดมทุน (แก้ส่วนนี้)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'กรุณาระบุ ID ของโครงการ' }, { status: 400 });
    }

    // เตรียมข้อมูลสำหรับ update
    const dataToUpdate: any = {
      ...updateData,
      ...(status && { status }),
      ...(updateData.goalAmount && { goalAmount: parseFloat(updateData.goalAmount) }),
    };

    // ถ้ามีการส่ง startDate มาใหม่ ให้ปรับเวลาเป็น 00:00
    if (updateData.startDate) {
      dataToUpdate.startDate = dayjs.tz(updateData.startDate, TIMEZONE).startOf('day').toDate();
    }

    // ถ้ามีการส่ง endDate มาใหม่ ให้ปรับเวลาเป็น 23:59
    if (updateData.endDate) {
      dataToUpdate.endDate = dayjs.tz(updateData.endDate, TIMEZONE).endOf('day').toDate();
    }

    const project = await prisma.donationProject.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({ message: 'อัพเดทโครงการสำเร็จ', project }, { status: 200 });
  } catch (error) {
    console.error('Error updating donation project:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการอัพเดทโครงการ' }, { status: 500 });
  }
}

// DELETE - ลบโครงการระดมทุน (คงเดิม ไม่ได้แก้ส่วนนี้)
export async function DELETE(request: NextRequest) {
  // ... (โค้ดเดิม) ...
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'กรุณาระบุ ID ของโครงการ' }, { status: 400 });
    }

    const transactionCount = await prisma.donationTransaction.count({
      where: { projectId: parseInt(id), status: 'SUCCESS' },
    });

    if (transactionCount > 0) {
      return NextResponse.json(
        { error: 'ไม่สามารถลบโครงการที่มีการบริจาคแล้วได้ กรุณาเปลี่ยนสถานะเป็น CLOSED แทน' },
        { status: 400 }
      );
    }

    await prisma.donationProject.delete({ where: { id: parseInt(id) } });

    return NextResponse.json({ message: 'ลบโครงการสำเร็จ' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting donation project:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการลบโครงการ' }, { status: 500 });
  }
}