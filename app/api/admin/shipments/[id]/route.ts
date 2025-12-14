import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

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

    if (!ALLOWED.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updated = await prisma.shipment.update({
      where: { id },
      data: {
        status,
        shippedAt: status === "DELIVERED" ? new Date() : undefined,
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (err: any) {
    console.error("PATCH /api/admin/shipments/[id] error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Internal Server Error", meta: err },
      { status: 500 }
    );
  }
}
