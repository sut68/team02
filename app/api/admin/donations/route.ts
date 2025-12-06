import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// GET - ดึงรายการผู้บริจาคพร้อมข้อมูลที่อยู่
export async function GET(request: NextRequest) {
  try {
    const donations = await prisma.donation.findMany({
      orderBy: { donatedAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            address: true,
            subdistrict: true,
            district: true,
            province: true,
            postalCode: true,
          },
        },
        souvenirItem: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            sku: true,
          },
        },
        shipments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    return NextResponse.json(donations);
  } catch (error) {
    console.error('Error fetching donations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch donations' },
      { status: 500 }
    );
  }
}
