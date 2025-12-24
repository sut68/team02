import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// GET - ดึงรายการผู้บริจาคพร้อมข้อมูลที่อยู่
export async function GET(request: NextRequest) {
  try {
    // 1st fetch: get all donations with shipments
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
        shipments: true,
      },
    });

    // Create shipment for any donation missing one, filling all required fields from schema
    await Promise.all(
      donations.map(async (d) => {
        if (!d.shipments || d.shipments.length === 0) {
          // Defensive: skip if user or souvenirItem is missing (should not happen)
          if (!d.user || !d.souvenirItem) return;
          await prisma.shipment.create({
            data: {
              donationId: d.id,
              userId: d.user.id,
              itemId: d.souvenirItem.id,
              qty: 1,
              receiverName: d.user.fullName ?? "-",
              phone: d.user.phone ?? "-",
              addressLine: d.user.address ?? "-",
              subdistrict: d.user.subdistrict ?? "-",
              district: d.user.district ?? "-",
              province: d.user.province ?? "-",
              postalCode: d.user.postalCode ?? "-",
              status: "PENDING",
              trackingNo: null,
            },
          });
        }
      })
    );

    // 2nd fetch: get all donations with shipment info for dropdown
    const refreshed = await prisma.donation.findMany({
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
          select: {
            id: true,
            status: true,
            trackingNo: true,
          },
        },
      },
    });

    return NextResponse.json(refreshed);
  } catch (error) {
    console.error('Error fetching donations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch donations' },
      { status: 500 }
    );
  }
}
