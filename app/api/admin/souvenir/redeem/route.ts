import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "เกิดข้อผิดพลาด";
}

// POST /api/admin/souvenir/redeem
export async function POST(request: NextRequest) {
  try {
    const { entitlementId, handledBy, method } = await request.json();

    if (!entitlementId || !handledBy) {
      return NextResponse.json(
        { error: "Missing entitlementId or handledBy" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const entitlement = await tx.entitlement.findUnique({
        where: { id: entitlementId },
        include: { item: true, user: true },
      });

      if (!entitlement) throw new Error("Entitlement not found");
      if (entitlement.qtyUsed >= entitlement.qtyGranted) {
        throw new Error("Entitlement already fully used");
      }

      const redemption = await tx.redemption.create({
        data: {
          entitlementId: entitlement.id,
          itemId: entitlement.itemId,
          userId: entitlement.userId,
          method: method ?? "QR_SCAN",
          handledBy,
        },
      });

      await tx.entitlement.update({
        where: { id: entitlement.id },
        data: { qtyUsed: { increment: 1 } },
      });

      await tx.stockMovement.create({
        data: {
          itemId: entitlement.itemId,
          delta: -1,
          reason: "redeem",
          refType: "Redemption",
          createdBy: handledBy,
        },
      });

      return redemption;
    });

    return NextResponse.json({ redemption: result }, { status: 200 });
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    console.error("Redeem error:", message, error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
