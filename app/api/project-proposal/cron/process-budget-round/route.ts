import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { ProjectProposalStatus, RoundStatus } from "@prisma/client";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    // 1. Security Check
    const { searchParams } = new URL(req.url);
    if (process.env.CRON_SECRET && searchParams.get("key") !== process.env.CRON_SECRET) {
       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    // 2. ค้นหารอบงบประมาณที่ "เปิดอยู่" (OPEN) แต่ "หมดเวลาแล้ว" (endDate < now)
    const expiredRounds = await prisma.budgetRound.findMany({
      where: { 
        status: RoundStatus.OPEN, // ใช้ Enum
        endDate: { lt: now } 
      },
      include: {
        proposals: true
      }
    });

    if (expiredRounds.length === 0) {
      return NextResponse.json({ message: "No expired rounds to process." });
    }

    const results = [];

    // 3. วนลูปประมวลผลทีละรอบ
    for (const round of expiredRounds) {
      const totalBudget = Number(round.totalBudget);
      let currentUsedBudget = 0;

      // 3.1 เรียงลำดับโครงการตามคะแนนโหวต (มาก -> น้อย)
      // แก้ round.projects เป็น round.proposals
      const rankedProjects = round.proposals.sort((a, b) => (b.scoreTotal || 0) - (a.scoreTotal || 0));

      // 3.2 คำนวณตัดเกรด (Greedy Approach)
      const updates = [];
      for (const p of rankedProjects) {
        // ข้ามโครงการที่สถานะไม่ใช่ OPEN
        if (p.status !== ProjectProposalStatus.OPEN) continue;

        const cost = Number(p.requestedAmount || 0);
        
        // 3. กำหนดค่าเริ่มต้นเป็น Enum (ไม่ใช่ String)
        let newStatus: ProjectProposalStatus = ProjectProposalStatus.CLOSE; 

        // ถ้างบพอ -> อนุมัติ
        if (currentUsedBudget + cost <= totalBudget) {
           currentUsedBudget += cost;
           newStatus = ProjectProposalStatus.APPROVED;
        }

        // เตรียมคำสั่ง Update สถานะโครงการ
        updates.push(
           prisma.projectProposal.update({
             where: { id: p.id },
             data: { status: newStatus } 
           })
        );
      }

      // 3.3 Execute Updates
      await prisma.$transaction(updates);

      // 3.4 ปิดรอบงบประมาณ (เปลี่ยนสถานะ Round เป็น CLOSED)
      await prisma.budgetRound.update({
        where: { id: round.id },
        data: { status: RoundStatus.CLOSED }
      });

      results.push({
        roundId: round.id,
        roundName: round.roundName,
        totalBudget,
        usedBudget: currentUsedBudget,
        projectsProcessed: updates.length
      });
    }

    return NextResponse.json({ success: true, processed: results });

  } catch (error) {
    console.error("Auto-Process Error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}