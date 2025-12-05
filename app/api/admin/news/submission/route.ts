import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-this-in-production";

type DecodedUser = {
  userId: number;
  email: string;
  role: string;
};

type VerifyStatus = "PENDING" | "APPROVED" | "REJECTED";

function getUserFromToken(req: NextRequest): DecodedUser | null {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedUser;
    return decoded;
  } catch (err) {
    console.warn("JWT ERROR:", err);
    return null;
  }
}

// ========= GET /api/admin/news/submission =========
export async function GET(req: NextRequest) {
  const user = getUserFromToken(req);
  console.log("ADMIN GET user from token =", user);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role?.toUpperCase() !== "ADMIN") {
    return NextResponse.json(
      { error: `Forbidden: role = ${user.role}` },
      { status: 403 }
    );
  }

  const submissions = await prisma.submission.findMany({
    include: { file: true },
    orderBy: { Date: "desc" },
  });

  return NextResponse.json({ submissions });
}

// ========= PATCH /api/admin/news/submission =========
export async function PATCH(req: NextRequest) {
  const user = getUserFromToken(req);
  console.log("ADMIN PATCH user from token =", user);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role?.toUpperCase() !== "ADMIN") {
    return NextResponse.json(
      { error: `Forbidden: role = ${user.role}` },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { id, status, remark } = body as {
    id?: number | string;
    status?: VerifyStatus;
    remark?: string | null;
  };

  // แปลง id ให้เป็น number
  const parsedId =
    typeof id === "string" ? Number(id) : typeof id === "number" ? id : NaN;

  if (!parsedId || Number.isNaN(parsedId)) {
    return NextResponse.json(
      { error: "ต้องระบุ id ของคำยื่นเรื่อง (number)" },
      { status: 400 }
    );
  }

  const allowed: VerifyStatus[] = ["PENDING", "APPROVED", "REJECTED"];
  if (!status || !allowed.includes(status)) {
    return NextResponse.json(
      { error: "สถานะไม่ถูกต้อง" },
      { status: 400 }
    );
  }

  try {
    const updated = await prisma.submission.update({
      where: { id: parsedId },
      data: {
        status,
        remark: remark ?? null,
      },
    });

    return NextResponse.json({ submission: updated });
  } catch (err) {
    console.error("PATCH /api/admin/news/submission error", err);
    return NextResponse.json(
      { error: "ไม่สามารถอัปเดตคำยื่นเรื่องได้" },
      { status: 500 }
    );
  }
}
