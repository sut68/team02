import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> | { id: string } }
) {
  const params = await ctx.params;
  const id = params?.id;

  if (!id) {
    return NextResponse.json({ error: "Missing content id" }, { status: 400 });
  }

  const contentId = Number(id);
  if (Number.isNaN(contentId)) {
    return NextResponse.json({ error: "Invalid content id" }, { status: 400 });
  }

  // ตัวอย่างข้อมูล registration (สามารถเชื่อมต่อฐานข้อมูลจริงได้ถ้าต้องการ)
  const registrations = [
    { id: 1, user: { name: "สมชาย", email: "a@example.com" }, status: "registered" },
    { id: 2, user: { name: "สมหญิง", email: "b@example.com" }, status: "claimed" },
  ];
  return NextResponse.json(registrations);
}
