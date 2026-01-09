// app/api/content/[id]/registrations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/app/lib/prisma';

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> } // รองรับ Next.js ใหม่
) {
  const params = await ctx.params;
  const id = params?.id;

  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const contentId = Number(id);
  if (Number.isNaN(contentId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    // 1. ดึง content เพื่อเอา souvenirItemId
    const content = await prisma.content.findUnique({
      where: { id: contentId },
      select: { souvenirItemId: true }
    });

    // 2. ดึง Booking พร้อมข้อมูล User และ Field ที่กรอก
    const bookings = await prisma.booking.findMany({
      where: { ContentID: contentId },
      include: {
        user: true, 
        bookingField: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // 3. ดึง Entitlements (สิทธิ์รับของ) แยกต่างหาก เพื่อมาประกบ
    let entitlementsMap: Record<number, any[]> = {};
    
    if (content?.souvenirItemId) {
        const userIds = bookings
            .map(b => b.Userid)
            .filter((uid): uid is number => uid !== null);

        if (userIds.length > 0) {
            const entitlements = await prisma.entitlement.findMany({
                where: {
                    itemId: content.souvenirItemId,
                    userId: { in: userIds },
                    source: 'BOOKING'
                },
                include: {
                    item: true,
                    redemptions: true
                }
            });

            // Group by userId
            entitlements.forEach(ent => {
                if (!entitlementsMap[ent.userId]) entitlementsMap[ent.userId] = [];
                entitlementsMap[ent.userId].push(ent);
            });
        }
    }

    // 4. Map ข้อมูลกลับไปให้ Frontend
    const registrations = bookings.map((b) => {
      const userEntitlements = (b.Userid && entitlementsMap[b.Userid]) ? entitlementsMap[b.Userid] : [];

      return {
        id: b.id,
        user: b.user
          ? {
              id: b.user.id,
              fullName: b.user.fullName,
              email: b.user.email,
              phone: b.user.phone,
            }
          : null,
        status: b.transactionStatus, // PENDING / SUCCESS
        registeredAt: b.createdAt,
        entitlements: userEntitlements.map((e) => ({
            id: e.id,
            qtyGranted: e.qtyGranted,
            qtyUsed: e.qtyUsed,
            redemptions: e.redemptions,
            item: e.item
              ? {
                  id: e.item.id,
                  name: e.item.name,
                  category: e.item.category,
                }
              : null,
          })),
        bookingField: b.bookingField || null,
      };
    });

    return NextResponse.json(registrations);

  } catch (error) {
    console.error("Error fetching registrations:", error);
    return NextResponse.json({ error: 'Failed to fetch registrations' }, { status: 500 });
  }
}