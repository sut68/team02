import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { EntitlementSource } from "@prisma/client";

const ALLOWED = ["PENDING", "IN_TRANSIT", "DELIVERED", "FAILED"] as const;
type ShipmentStatus = (typeof ALLOWED)[number];

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = await ctx.params;
    const id = Number(params.id);

    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid shipment id" }, { status: 400 });
    }

    const body = await req.json();
    const status = body?.status as ShipmentStatus;
    const trackingNo = body?.trackingNo as string | null | undefined;

    if (!ALLOWED.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // ตรวจสอบ shipment ปัจจุบัน
    const currentShipment = await prisma.shipment.findUnique({
      where: { id },
    });

    if (!currentShipment) {
      return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
    }

    // ❌ ห้ามเปลี่ยนจาก DELIVERED กลับไปเป็น PENDING หรือ IN_TRANSIT
    if (currentShipment.status === "DELIVERED" && status !== "DELIVERED") {
      return NextResponse.json(
        { error: "ไม่สามารถเปลี่ยนสถานะจากจัดส่งแล้วกลับไปได้" },
        { status: 400 }
      );
    }

    // ✅ เมื่อเปลี่ยนเป็น DELIVERED ต้องมี trackingNo
    if (status === "DELIVERED") {
      if (!trackingNo || trackingNo.trim() === "") {
        return NextResponse.json(
          { error: "ต้องใส่เลขแทรกก่อนที่จะเปลี่ยนสถานะเป็นจัดส่งแล้ว" },
          { status: 400 }
        );
      }
    }

    // อัปเดต shipment
    const updated = await prisma.shipment.update({
      where: { id },
      data: {
        status,
        trackingNo: status === "DELIVERED" ? trackingNo : currentShipment.trackingNo,
        deliveredAt: status === "DELIVERED" ? new Date() : currentShipment.deliveredAt,
        shippedAt: status === "IN_TRANSIT" && !currentShipment.shippedAt ? new Date() : currentShipment.shippedAt,
      },
    });

    // ✅ ตัดสต็อก (qtyUsed++) เมื่อเปลี่ยนเป็น DELIVERED
    if (status === "DELIVERED" && currentShipment.status !== "DELIVERED") {
      await prisma.$transaction(async (tx) => {
        const entitlement = await tx.entitlement.findFirst({
          where: {
            donationId: updated.donationId,
            itemId: updated.itemId,
            source: EntitlementSource.DONATION,
          },
          include: { item: true },
        });

        if (entitlement && entitlement.qtyUsed < entitlement.qtyGranted) {
          await tx.entitlement.update({
            where: { id: entitlement.id },
            data: { qtyUsed: { increment: 1 } },
          });
        }

        // สร้าง StockMovement (ตัดสต็อก)
        await tx.stockMovement.create({
          data: {
            itemId: updated.itemId,
            delta: -1,
            reason: "ship",
            refType: "Shipment",
            createdBy: 0, // System action
          },
        });
      });
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (err: any) {
    console.error("PATCH /api/admin/shipments/[id] error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Internal Server Error", meta: err },
      { status: 500 }
    );
  }
}
