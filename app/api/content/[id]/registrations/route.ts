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
      return NextResponse.json(
        { error: "Invalid Content ID" },
        { status: 400 }
      );
    }

    // 1. ดึงข้อมูลการจอง (Booking) ของกิจกรรมนี้
    const bookings = await prisma.booking.findMany({
      where: {
        ContentID: contentId,
        transactionStatus: "SUCCESS", // เอาเฉพาะคนที่จ่ายเงิน/จองสำเร็จแล้
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 2. ดึงข้อมูล Content เพื่อดูว่าแจกของชิ้นไหน
    const content = await prisma.content.findUnique({
      where: { id: contentId },
      select: { souvenirItemId: true },
    });

    // 3. ประกอบร่างข้อมูล เพื่อเช็คว่า User แต่ละคนได้รับของ (Entitlement) หรือยัง
    const results = await Promise.all(
      bookings.map(async (booking) => {
        const entitlements: any[] = [];

        // ถ้ากิจกรรมนี้มีของแจก และ Booking มี User
        if (content?.souvenirItemId && booking.Userid) {
          const ent = await prisma.entitlement.findFirst({
            where: {
              userId: booking.Userid,
              itemId: content.souvenirItemId,
              source: "BOOKING",
            },
            include: {
              item: { select: { name: true } },
            },
          });
          if (ent) {
            // 🛡️ Map entitlement to match frontend expectations
            entitlements.push({
              item: ent.item,
              qtyUsed: ent.qtyUsed || 0,
              qtyGranted: ent.qtyGranted || 0,
            });
          }
        }

        return {
          id: booking.id,
          userId: booking.Userid,
          registeredAt: booking.createdAt,
          attendanceStatus: booking.transactionStatus,
          user: booking.user,
          entitlements: entitlements, // ส่งกลับไปให้ Frontend เช็คว่ารับของยัง
        };
      })
    );

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error fetching registrations:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}