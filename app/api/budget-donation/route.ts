import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { TransactionStatus } from "@prisma/client";
import { BudgetSchema } from "../../../lib/models/validation"; 

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Validation (รับ projectId มาจาก Form)
    const validatedData = BudgetSchema.parse({
      ...body,
      amount: Number(body.amount),
      projectId: Number(body.projectId)
    });

    const { 
      projectId, amount, fullName, email, phone, 
      address, subdistrict, district, province, postalCode, message 
    } = validatedData;

    const userId = body.userId ? Number(body.userId) : null;
    const isPublic = body.isPublic !== undefined ? Boolean(body.isPublic) : true;
    const paymentMethodId = body.paymentMethodId ? Number(body.paymentMethodId) : undefined;
    const paymentSlipUrl = body.paymentSlipUrl ? String(body.paymentSlipUrl) : undefined;

    if (!userId) {
       return NextResponse.json({ error: "ไม่พบข้อมูลผู้ใช้งาน (กรุณา Login)" }, { status: 401 });
    }

    // --- 2. ตรวจสอบ Project (ตามที่ User เลือก) ---
    const project = await prisma.donationProject.findUnique({
      where: { id: projectId },
      select: { id: true, status: true, endDate: true },
    });

    if (!project || project.status !== "OPEN") {
      return NextResponse.json({ error: "โครงการนี้ปิดรับบริจาคแล้ว" }, { status: 400 });
    }
    if (new Date() > new Date(project.endDate)) {
      return NextResponse.json({ error: "โครงการนี้หมดเวลาแล้ว" }, { status: 400 });
    }

    const currentBudgetRound = await prisma.budgetRound.findFirst({
        where: {
            status: 'OPEN', 
        },
        orderBy: {
            id: 'desc' 
        },
        select: { id: true }
    });

    if (!currentBudgetRound) {
        return NextResponse.json({ error: "ขณะนี้ไม่มีรอบงบประมาณที่เปิดรับบริจาค (No Active Budget Round)" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      
      const paymentCreate: any = {
        amount,
        paymentStatus: "PENDING",
      };
      if (paymentMethodId !== undefined) paymentCreate.paymentMethodId = paymentMethodId;
      if (paymentSlipUrl) paymentCreate.paymentSlipUrl = paymentSlipUrl;

      const newBudgetDonation = await tx.budgetDonation.create({
        data: {
          projectId: project.id,                 // จาก Form ที่ User เลือก
          budgetRoundId: currentBudgetRound.id,  // จากการค้นหา Round ปัจจุบันในระบบ
          userId: userId,

          amount,
          isPublic,
          message: message || null,
          status: TransactionStatus.PENDING,

          // ข้อมูล Address (Required)
          fullName: fullName || "",
          email: email || "",
          phone: phone || "",
          address: address || "",
          subdistrict: subdistrict || "",
          district: district || "",
          province: province || "",
          postalCode: postalCode || "",

          paymentRecord: {
            create: paymentCreate
          }
        },
        include: {
          project: { select: { title: true } },
          paymentRecord: true,
        },
      });

      return newBudgetDonation;
    });

    return NextResponse.json(
      { 
        message: "สร้างรายการบริจาคสำเร็จ", 
        transaction: result,
        paymentId: result.paymentRecord?.id
      },
      { status: 201 }
    );

  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Error creating budget donation:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในระบบ" }, { status: 500 });
  }
}