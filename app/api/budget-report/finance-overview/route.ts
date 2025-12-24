import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  try {
    // 1. รายรับจากโครงการระดมทุน (DonationTransaction ที่สำเร็จ)
    const fundraising = await prisma.donationTransaction.aggregate({
      _sum: { amount: true },
      where: { status: "SUCCESS" }
    });
    const fundraisingTotal = fundraising._sum.amount || 0;

    // 2. รายรับจากการบริจาคเข้ากองทุน/รอบงบประมาณ (BudgetDonation ที่สำเร็จ)
    const budgetDonations = await prisma.budgetDonation.aggregate({
      _sum: { amount: true },
      where: { status: "SUCCESS" }
    });
    const budgetDonationTotal = budgetDonations._sum.amount || 0;

    // 3. รายจ่ายจริงจากรายงานผลโครงการ (SummarySubmission ที่อนุมัติแล้ว)
    // หมายเหตุ: นับเฉพาะสถานะ APPROVED เพื่อความถูกต้องทางบัญชี
    const expenses = await prisma.summarySubmission.aggregate({
      _sum: { totalActualExpense: true },
      where: { status: "APPROVED" }
    });
    const expenseTotal = expenses._sum.totalActualExpense || 0;

    // 4. คำนวณยอดคงเหลือ
    const totalIncome = fundraisingTotal + budgetDonationTotal;
    const balance = totalIncome - expenseTotal;

    return NextResponse.json({
      income: {
        fundraising: fundraisingTotal,
        donations: budgetDonationTotal,
        total: totalIncome
      },
      expense: expenseTotal,
      balance: balance
    });

  } catch (error) {
    console.error("Financial Overview Error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการคำนวณยอดเงิน" }, 
      { status: 500 }
    );
  }
}