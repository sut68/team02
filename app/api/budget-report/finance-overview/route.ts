import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roundId = searchParams.get("roundId");
    const fiscalYear = searchParams.get("fiscalYear");

    const roundWhere: any = {};
    if (roundId && roundId !== "all") {
        roundWhere.id = Number(roundId);
    } else if (fiscalYear && fiscalYear !== "all") {
        roundWhere.fiscalYear = fiscalYear;
    }

    // ---------------------------------------------------------
    // 1. รายรับจากโครงการระดมทุน (DonationTransaction)
    // ---------------------------------------------------------
    // ❌ DonationTransaction และ DonationProject ไม่มี deletedAt ใน Schema
    // ❌ DonationProject ไม่มีความสัมพันธ์กับ BudgetRound
    const fundraising = await prisma.donationTransaction.aggregate({
      _sum: { amount: true },
      where: { 
        status: "SUCCESS",
        // deletedAt: null,  <-- ลบออก เพราะ Schema ไม่มี
        // project: { deletedAt: null } <-- ลบออก เพราะ Schema ไม่มี
      }
    });
    // ใช้ Optional Chaining (?) ป้องกัน undefined
    const fundraisingTotal = fundraising._sum?.amount || 0;

    // ---------------------------------------------------------
    // 2. รายรับจากเงินบริจาคเข้ากองทุน (BudgetDonation)
    // ---------------------------------------------------------
    const budgetDonations = await prisma.budgetDonation.aggregate({
      _sum: { amount: true },
      where: { 
        status: "SUCCESS",
        deletedAt: null, // ✅ ใช้ได้ เพราะ Schema มี deletedAt
        // ✅ ใช้ได้ เพราะ BudgetDonation ผูกกับ BudgetRound โดยตรง
        budgetRound: Object.keys(roundWhere).length > 0 ? roundWhere : undefined
      }
    });
    const budgetDonationTotal = budgetDonations._sum?.amount || 0;

    // ---------------------------------------------------------
    // 3. รายจ่ายจริงจากรายงานผล (SummarySubmission)
    // ---------------------------------------------------------
    const expenses = await prisma.summarySubmission.aggregate({
      _sum: { totalActualExpense: true },
      where: { 
        status: "APPROVED",
        deletedAt: null, // ✅ ใช้ได้ เพราะ Schema มี deletedAt
        proposal: {
            deletedAt: null, // ✅ ใช้ได้ เพราะ ProjectProposal มี deletedAt
            // ✅ ใช้ได้ เพราะ Proposal ผูกกับ BudgetRound
            budgetRound: Object.keys(roundWhere).length > 0 ? roundWhere : undefined
        }
      }
    });
    const expenseTotal = expenses._sum?.totalActualExpense || 0;

    // ---------------------------------------------------------
    // 4. สรุปยอด
    // ---------------------------------------------------------
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