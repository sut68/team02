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

// POST: ทำการโหวต
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

    // ✅ แก้ไข 1: ใช้ alumniId แทน userId
    const existingVote = await prisma.projectVote.findFirst({
      where: {
        alumniId: user.userId, 
      },
    });

    if (existingVote) {
      return NextResponse.json(
        { error: "คุณใช้สิทธิ์โหวตไปแล้ว (1 คน โหวตได้ 1 โครงการเท่านั้น)" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // ✅ แก้ไข 2: ใช้ alumniId และ proposalId
      const newVote = await tx.projectVote.create({
        data: {
          alumniId: user.userId,           // เปลี่ยน userId -> alumniId
          proposalId: Number(projectId),   // เปลี่ยน projectProposalId -> proposalId
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

// GET: เช็คสถานะการโหวต
export async function GET(req: NextRequest) {
  const user = getUserFromToken(req);
  if (!user) return NextResponse.json({ voted: false });

  // ✅ แก้ไข 3: ใช้ alumniId และ proposalId
  const vote = await prisma.projectVote.findFirst({
    where: { alumniId: user.userId }, // เปลี่ยน userId -> alumniId
    select: { proposalId: true }      // เปลี่ยน projectProposalId -> proposalId
  });

  return NextResponse.json({ 
    voted: !!vote, 
    votedProjectId: vote?.proposalId || null 
  });
}