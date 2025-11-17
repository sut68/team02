import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Build where clause
    const where: any = {};

    // Filter by verification status
    if (status && status !== 'all') {
      where.verification = {
        status: status.toUpperCase()
      };
    }

    // Search filter
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { educationRecords: { some: { studentCode: { contains: search, mode: 'insensitive' } } } }
      ];
    }

    // Fetch users with relations
    const users = await prisma.user.findMany({
      where,
      include: {
        educationRecords: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1 // Get the most recent education record
        },
        verification: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform data for frontend
    const transformedUsers = users.map((user: any) => ({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      address: {
        address: user.address,
        subdistrict: user.subdistrict,
        district: user.district,
        province: user.province,
        postalCode: user.postalCode
      },
      educationRecord: user.educationRecords[0] || null,
      verification: user.verification || null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));

    return NextResponse.json({ 
      success: true,
      users: transformedUsers 
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้' },
      { status: 500 }
    );
  }
}
