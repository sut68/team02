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

    const fundraisingTotal = 0;

    // 2. รายรับจากเงินบริจาคเข้ากองทุน (BudgetDonation)
    const budgetDonations = await prisma.budgetDonation.aggregate({
      _sum: { amount: true },
      where: { 
        status: "SUCCESS",
        deletedAt: null,
        budgetRound: Object.keys(roundWhere).length > 0 ? roundWhere : undefined
      }
    });
    const budgetDonationTotal = budgetDonations._sum?.amount || 0;

    // 3. รายจ่ายจริงจากรายงานผล (SummarySubmission)
    const expenses = await prisma.summarySubmission.aggregate({
      _sum: { totalActualExpense: true },
      where: { 
        status: "APPROVED",
        deletedAt: null,
        proposal: {
            deletedAt: null,
            budgetRound: Object.keys(roundWhere).length > 0 ? roundWhere : undefined
        }
      }
    });
    const expenseTotal = expenses._sum?.totalActualExpense || 0;

    // 4. สรุปยอด
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