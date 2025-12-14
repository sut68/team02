import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { TransactionStatus } from "@prisma/client";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "เกิดข้อผิดพลาด";
}

function toNumber(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function isTransactionStatus(value: unknown): value is TransactionStatus {
  return typeof value === "string" && (Object.values(TransactionStatus) as string[]).includes(value);
}

// POST - สร้างธุรกรรมการบริจาค
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const projectId = toNumber(body.projectId);
    const amount = toNumber(body.amount);
    const isPublic = body.isPublic as boolean | undefined;

    const userId = toNumber(body.userId);
    const paymentMethodId = toNumber(body.paymentMethodId);
    const paymentSlipUrl = (body.paymentSlipUrl as string | undefined) ?? null;

    // ใช้กับ donation.purpose เท่านั้น (ถ้ามี model Donation)
    const message = (body.message as string | undefined) ?? null;

    if (!projectId || amount == null) {
      return NextResponse.json(
        { error: "กรุณาระบุโครงการและจำนวนเงิน" },
        { status: 400 }
      );
    }
    if (amount <= 0) {
      return NextResponse.json({ error: "จำนวนเงินไม่ถูกต้อง" }, { status: 400 });
    }

    // ✅ ห้าม select souvenirItemId เพราะ schema ไม่มี
    const project = await prisma.donationProject.findUnique({
      where: { id: projectId },
      select: { id: true, status: true, endDate: true },
    });

    if (!project || project.status !== "OPEN") {
      return NextResponse.json({ error: "โครงการนี้ไม่เปิดรับบริจาค" }, { status: 400 });
    }

    if (new Date() > new Date(project.endDate)) {
      return NextResponse.json({ error: "โครงการนี้หมดเวลารับบริจาคแล้ว" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // ✅ ไม่ใช้ paymentId เพราะ schema DonationTransaction ไม่มี paymentId
      // ✅ ใช้ nested create ผ่าน relation paymentRecords
      const transaction = await tx.donationTransaction.create({
        data: {
          projectId,
          amount,
          isPublic: isPublic !== false,
          userId: userId ?? null,
          status: TransactionStatus.SUCCESS,

          paymentRecords: {
            create: {
              amount,
              paymentSlipUrl,
              paymentStatus: "CONFIRMED",
              paymentMethodId: paymentMethodId ?? null,
            },
          },
        },
        include: {
          project: { select: { id: true, title: true } },
          user: userId
            ? { select: { fullName: true, email: true } }
            : false,
          paymentRecords: { include: { paymentMethod: true } },
        },
      });

      await tx.donationProject.update({
        where: { id: projectId },
        data: { currentAmount: { increment: amount } },
      });

      // ถ้าคุณมี model Donation และอยากเก็บ message เป็น purpose
      if (userId) {
        await tx.donation.create({
          data: {
            userId,
            amount,
            purpose: message,
            status: "completed",
          },
        });
      }

      return transaction;
    });

    return NextResponse.json(
      { message: "บริจาคสำเร็จ", transaction: result },
      { status: 201 }
    );
  } catch (error: unknown) {
    const msg = getErrorMessage(error);
    console.error("Error creating donation transaction:", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// GET - ดึงรายการธุรกรรมการบริจาค
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const projectId = toNumber(searchParams.get("projectId"));
    const userId = toNumber(searchParams.get("userId"));
    const statusParam = searchParams.get("status");

    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (userId) where.userId = userId;

    if (statusParam) {
      if (!isTransactionStatus(statusParam)) {
        return NextResponse.json({ error: "status ไม่ถูกต้อง" }, { status: 400 });
      }
      where.status = statusParam;
    }

    const transactions = await prisma.donationTransaction.findMany({
      where,
      include: {
        project: { select: { id: true, title: true } },
        user: { select: { id: true, fullName: true, email: true } },
        paymentRecords: { include: { paymentMethod: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ transactions }, { status: 200 });
  } catch (error: unknown) {
    const msg = getErrorMessage(error);
    console.error("Error fetching transactions:", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// PUT - อัพเดทสถานะธุรกรรม
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const id = toNumber(body.id);
    const status = body.status as unknown;

    if (!id) {
      return NextResponse.json({ error: "กรุณาระบุ ID ของธุรกรรม" }, { status: 400 });
    }
    if (!isTransactionStatus(status)) {
      return NextResponse.json({ error: "status ไม่ถูกต้อง" }, { status: 400 });
    }

    const transaction = await prisma.$transaction(async (tx) => {
      const oldTx = await tx.donationTransaction.findUnique({
        where: { id },
        select: { status: true, amount: true, projectId: true },
      });

      if (!oldTx) throw new Error("Transaction not found");

      const updatedTransaction = await tx.donationTransaction.update({
        where: { id },
        data: { status },
        include: {
          project: { select: { id: true, title: true } },
          paymentRecords: true,
        },
      });

      if (oldTx.status === TransactionStatus.SUCCESS && status !== TransactionStatus.SUCCESS) {
        await tx.donationProject.update({
          where: { id: oldTx.projectId },
          data: { currentAmount: { decrement: oldTx.amount } },
        });
      }

      if (oldTx.status !== TransactionStatus.SUCCESS && status === TransactionStatus.SUCCESS) {
        await tx.donationProject.update({
          where: { id: oldTx.projectId },
          data: { currentAmount: { increment: oldTx.amount } },
        });
      }

      return updatedTransaction;
    });

    return NextResponse.json(
      { message: "อัพเดทสถานะธุรกรรมสำเร็จ", transaction },
      { status: 200 }
    );
  } catch (error: unknown) {
    const msg = getErrorMessage(error);
    console.error("Error updating transaction:", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
