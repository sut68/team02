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

// POST: โหวตโครงการ
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

    const targetProject = await prisma.projectProposal.findUnique({
      where: { id: Number(projectId) },
      include: { budgetRound: true }
    });

    if (!targetProject) {
      return NextResponse.json({ error: "ไม่พบข้อมูลโครงการ" }, { status: 404 });
    }

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

    // ตรวจสอบเงื่อนไขเวลา: 15 วันก่อนปิดรอบ
    if (targetProject.budgetRound?.endDate) {
        const endDate = new Date(targetProject.budgetRound.endDate);
        const now = new Date();

        // 1. เช็คว่าหมดเวลาโหวตหรือยัง (เกินวันปิดรอบ)
        if (now > endDate) {
             return NextResponse.json(
                { error: "หมดเวลาการโหวตแล้ว (รอระบบประมวลผลสรุปคะแนน)" },
                { status: 400 }
             );
        }
        
        // 2. เช็คว่าถึงเวลาเปิดโหวตหรือยัง (ต้องอยู่ในช่วง 15 วันก่อนปิดรอบ)
        const fifteenDaysInMs = 15 * 24 * 60 * 60 * 1000;
        const timeRemaining = endDate.getTime() - now.getTime();

        // ถ้าเวลายังเหลือมากกว่า 15 วัน แสดงว่ายังไม่ถึงเวลาเปิดโหวต
        if (timeRemaining > fifteenDaysInMs) {
             const votingStartDate = new Date(endDate.getTime() - fifteenDaysInMs);
             const dateStr = votingStartDate.toLocaleDateString('th-TH', { 
                day: 'numeric', month: 'long', year: 'numeric' 
             });

             return NextResponse.json(
                { error: `ยังไม่เปิดให้โหวต: ระบบจะเปิดให้โหวตในช่วง 15 วันสุดท้ายของรอบเท่านั้น (เริ่ม ${dateStr})` },
                { status: 400 }
             );
        }
    }

    // เช็คประวัติการบริจาค
    const donationRecord = await prisma.budgetDonation.findFirst({
        where: {
            userId: user.userId,
            budgetRoundId: targetProject.budgetRoundId, 
            deletedAt: null 
        }
    });

    if (!donationRecord) {
        return NextResponse.json(
            { error: "ขออภัย: คุณต้องร่วมบริจาคในรอบงบประมาณนี้ก่อน จึงจะมีสิทธิ์โหวต" },
            { status: 403 }
        );
    }

    // เช็คประวัติการโหวตซ้ำ
    const existingVote = await prisma.projectVote.findFirst({
      where: {
        alumniId: user.userId,
        proposal: {
            budgetRoundId: targetProject.budgetRoundId 
        }
      },
    });

    if (existingVote) {
      return NextResponse.json(
        { error: "คุณใช้สิทธิ์โหวตในรอบงบประมาณนี้ไปแล้ว (1 คน โหวตได้ 1 โครงการต่อรอบ)" },
        { status: 400 }
      );
    }

    // บันทึกการโหวต
    const result = await prisma.$transaction(async (tx) => {
      const newVote = await tx.projectVote.create({
        data: {
          alumniId: user.userId,
          proposalId: Number(projectId),
          voteWeight: 1,
        },
      });

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

// GET: ตรวจสอบสถานะการโหวตของผู้ใช้ + [เพิ่ม] ส่ง activeRoundId กลับไป
export async function GET(req: NextRequest) {
  const user = getUserFromToken(req);
  // ถ้าไม่ได้ Login ก็ส่งกลับไปว่ายังไม่โหวต และไม่มี Active Round (เพื่อความปลอดภัย)
  if (!user) return NextResponse.json({ voted: false, activeRoundId: null });

  try {
    const openRounds = await prisma.budgetRound.findMany({
        where: { status: 'OPEN' },
        select: { id: true },
        orderBy: { endDate: 'asc' } // เอารอบที่ใกล้ปิดที่สุดขึ้นก่อน (กรณีมีหลายรอบ)
    });

    if (openRounds.length === 0) {
        return NextResponse.json({ voted: false, activeRoundId: null });
    }

    // เพิ่ม: เก็บ ID ของรอบที่กำลังเปิดอยู่ (ใช้ตัวแรกสุด)
    const activeRoundId = openRounds[0].id;
    const openRoundIds = openRounds.map(r => r.id);

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
      canVote: !!donation,
      activeRoundId: activeRoundId
    });

  } catch (error) {
    console.error("Check vote error:", error);
    return NextResponse.json({ voted: false });
  }
}