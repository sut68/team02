import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const contentId = parseInt(id);

    if (isNaN(contentId)) {
      return NextResponse.json({ error: "Invalid Content ID" }, { status: 400 });
    }

    // 1. ดึงข้อมูลการจอง
    const bookings = await prisma.booking.findMany({
      where: {
        ContentID: contentId,
        transactionStatus: "SUCCESS",
      },
      include: {
        user: {
          select: { id: true, fullName: true, email: true },
        },
        bookingField: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // 2. ดึงข้อมูล Content
    const content = await prisma.content.findUnique({
      where: { id: contentId },
      select: { souvenirItemId: true },
    });

    // 3. ประกอบร่างข้อมูล
    const results = await Promise.all(
      bookings.map(async (booking) => {
        const entitlements: any[] = [];

        // ✅ แก้ไขตรงนี้: ดึง Entitlement จาก bookingId โดยตรง
        // ไม่ต้องเช็ค content.souvenirItemId แล้ว เพราะ Booking ผูกกับ Entitlement ไว้อยู่แล้ว
        const ent = await prisma.entitlement.findFirst({
          where: {
            bookingId: booking.id, // <--- Key change: Link by Booking ID
          },
          include: {
            item: { select: { name: true } },
          },
        });

        if (ent) {
          entitlements.push({
            item: ent.item,
            qtyUsed: ent.qtyUsed || 0,
            qtyGranted: ent.qtyGranted || 0,
          });
        }

        // Logic เลือกชื่อที่จะแสดง
        const displayName = booking.user?.fullName || booking.bookingField?.Name || "-";

        return {
          id: booking.id,
          userId: booking.Userid,
          registeredAt: booking.createdAt,
          attendanceStatus: booking.transactionStatus,
          user: {
            id: booking.user?.id || 0,
            fullName: displayName,
            email: booking.user?.email || "-",
          },
          entitlements: entitlements,
        };
      })
    );

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error fetching registrations:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}