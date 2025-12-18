import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production";

function getUserFromToken(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number; role: string };
  } catch (e) {
    return null;
  }
}

// -----------------------------------------------------------------------------
// POST: ทำการโหวต
// -----------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนโหวต" }, { status: 401 });
    }

    const body = await req.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json({ error: "ไม่พบรหัสโครงการ" }, { status: 400 });
    }

    // 1. ดึงข้อมูลโครงการที่จะโหวต เพื่อดูว่าอยู่ "รอบงบประมาณ (Budget Round)" ไหน
    const targetProject = await prisma.projectProposal.findUnique({
      where: { id: Number(projectId) },
      select: { budgetRoundId: true, status: true }
    });

    if (!targetProject) {
      return NextResponse.json({ error: "ไม่พบข้อมูลโครงการ" }, { status: 404 });
    }

    // ตรวจสอบความสมบูรณ์ของข้อมูล (กันค่า null)
    if (!targetProject.budgetRoundId) {
      return NextResponse.json(
        { error: "ข้อมูลโครงการไม่สมบูรณ์ (ไม่ระบุรอบงบประมาณ)" },
        { status: 500 }
      );
    }

    // ตรวจสอบสถานะโครงการ (ต้องเปิดรับโหวตอยู่)
    if (targetProject.status !== 'OPEN') {
      return NextResponse.json({ error: "โครงการนี้ปิดรับคะแนนโหวตแล้ว" }, { status: 400 });
    }

    // =========================================================================
    // 🛑 STEP 1: เช็คประวัติการบริจาค (ตามรอบงบประมาณ)
    // =========================================================================
    // ผู้ใช้ต้องเคยบริจาคเข้ากองทุน "ในรอบงบประมาณเดียวกับโครงการนี้"
    const donationRecord = await prisma.budgetDonation.findFirst({
        where: {
            userId: user.userId,
            budgetRoundId: targetProject.budgetRoundId, // ✅ Key สำคัญ: เช็คเฉพาะรอบนี้
            deletedAt: null // ต้องไม่ถูกยกเลิก
        }
    });

    if (!donationRecord) {
        return NextResponse.json(
            { error: "ขออภัย: คุณต้องร่วมบริจาคในรอบงบประมาณนี้ก่อน จึงจะมีสิทธิ์โหวต" },
            { status: 403 }
        );
    }

    // =========================================================================
    // 🛑 STEP 2: เช็คประวัติการโหวต (ตามรอบงบประมาณ)
    // =========================================================================
    // เช็คว่าเคยใช้สิทธิ์โหวต "ในรอบงบประมาณนี้" ไปหรือยัง
    const existingVote = await prisma.projectVote.findFirst({
      where: {
        alumniId: user.userId,
        proposal: {
            budgetRoundId: targetProject.budgetRoundId // ✅ Key สำคัญ: เช็คเฉพาะรอบนี้
        }
      },
    });

    if (existingVote) {
      return NextResponse.json(
        { error: "คุณใช้สิทธิ์โหวตในรอบงบประมาณนี้ไปแล้ว (1 คน โหวตได้ 1 โครงการต่อรอบ)" },
        { status: 400 }
      );
    }

    // =========================================================================
    // ✅ STEP 3: บันทึกการโหวต
    // =========================================================================
    const result = await prisma.$transaction(async (tx) => {
      // 3.1 สร้าง Record การโหวต
      const newVote = await tx.projectVote.create({
        data: {
          alumniId: user.userId,
          proposalId: Number(projectId),
          voteWeight: 1,
        },
      });

      // 3.2 เพิ่มคะแนนให้โครงการ
      const updatedProject = await tx.projectProposal.update({
        where: { id: Number(projectId) },
        data: {
          scoreTotal: {
            increment: 1,
          },
        },
      });

      return { newVote, updatedProject };
    });

    return NextResponse.json({ message: "โหวตสำเร็จ", data: result }, { status: 200 });

  } catch (error) {
    console.error("Vote error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการโหวต" }, { status: 500 });
  }
}

// -----------------------------------------------------------------------------
// GET: เช็คสถานะการโหวต (สำหรับแสดงผลหน้าเว็บ)
// -----------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const user = getUserFromToken(req);
  if (!user) return NextResponse.json({ voted: false });

  try {
    // 1. หา Budget Round ที่กำลังเปิด (OPEN) อยู่ ณ ตอนนี้
    // (เมื่อขึ้นรอบใหม่ รอบเก่าจะ Closed ทำให้ openRounds เปลี่ยนเป็นรอบใหม่)
    const openRounds = await prisma.budgetRound.findMany({
        where: { status: 'OPEN' },
        select: { id: true }
    });

    // ถ้าไม่มีรอบเปิดอยู่เลย แสดงว่ายังโหวตไม่ได้
    if (openRounds.length === 0) {
        return NextResponse.json({ voted: false });
    }

    const openRoundIds = openRounds.map(r => r.id);

    // 2. เช็คว่า "ในรอบที่เปิดอยู่นี้" ผู้ใช้โหวตไปหรือยัง
    // (ข้อมูลการโหวตของรอบเก่าจะไม่ถูกนับรวมที่นี่ เพราะ id ไม่ตรงกับ openRoundIds)
    const vote = await prisma.projectVote.findFirst({
      where: { 
        alumniId: user.userId,
        proposal: {
            budgetRoundId: { in: openRoundIds }
        }
      },
      select: { proposalId: true }
    });

    const donation = await prisma.budgetDonation.findFirst({
      where: {
        userId: user.userId,
        budgetRoundId: { in: openRoundIds },
        deletedAt: null
      }
    });

    return NextResponse.json({ 
      voted: !!vote, 
      votedProjectId: vote?.proposalId || null,
      canVote: !!donation // ส่งค่านี้ไปบอกหน้าเว็บ
    });

  } catch (error) {
    console.error("Check vote error:", error);
    return NextResponse.json({ voted: false });
  }
}