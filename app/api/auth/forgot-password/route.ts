import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { transporter, mailOptions } from "@/app/lib/nodemailer";
import crypto from "crypto";

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "กรุณากรอกอีเมล" }, { status: 400 });
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json({ error: "กรุณากรอกที่อยู่อีเมลให้ถูกต้อง" }, { status: 400 });
    }

    // ✅ กัน enumeration: ตอบ success เหมือนกันเสมอ
    const genericResponse = NextResponse.json({
      success: true,
      message: "หากอีเมลนี้มีในระบบ เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปแล้ว",
    });

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) return genericResponse;

    // 1) สร้าง token (ส่งให้ user) และเก็บ hash ใน DB
    const rawToken = crypto.randomBytes(32).toString("hex"); // 64 chars
    const tokenHash = sha256(rawToken);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 นาที

    // 2) ทำความสะอาด token เก่า (optional แต่ดี)
    await prisma.passwordResetToken.deleteMany({
      where: {
        email: normalizedEmail,
        OR: [{ expiresAt: { lt: new Date() } }, { usedAt: { not: null } }],
      },
    });

    // 3) บันทึก token ใหม่
    await prisma.passwordResetToken.create({
      data: {
        email: normalizedEmail,
        tokenHash,
        expiresAt,
      },
    });

    // 4) สร้าง reset url
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://www.sut-alumniconnect.me";

    const resetUrl = `${baseUrl}/auth/reset-password?token=${rawToken}&email=${encodeURIComponent(normalizedEmail)}`;

    // 5) ทำ emailHtml ให้เป็น string ทั้งก้อน (ห้ามมี </div> ลอยๆ)
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; background: #ffffff; padding: 24px; max-width: 640px; margin: 0 auto;">
        <h2 style="margin: 0 0 10px 0; color: #111827;">รีเซ็ตรหัสผ่าน</h2>
        <p style="margin: 0 0 16px 0; color: #374151; font-size: 14px;">
          เราได้รับคำขอรีเซ็ตรหัสผ่านสำหรับบัญชีของคุณ หากเป็นคุณที่ทำรายการ ให้กดปุ่มด้านล่าง
        </p>

        <div style="margin: 18px 0;">
          <a href="${resetUrl}"
             style="display:inline-block; padding: 12px 18px; background:#f97316; color:#fff; text-decoration:none; border-radius:10px; font-weight:600;">
            รีเซ็ตรหัสผ่าน
          </a>
        </div>

        <div style="background: #f9fafb; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0; color: #555; font-size: 14px;">
            หากปุ่มด้านบนไม่ทำงาน คัดลอกลิงก์นี้ไปวางในเบราว์เซอร์:
          </p>
          <p style="margin: 0; word-break: break-all; color: #f97316; font-size: 13px;">
            ${resetUrl}
          </p>
        </div>

        <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; color: #1565c0; font-size: 14px;">
            <strong>💡 คำแนะนำ:</strong> หากคุณไม่ได้ทำการขอรีเซ็ตรหัสผ่าน กรุณาเพิกเฉยต่ออีเมลนี้ รหัสผ่านของคุณจะไม่มีการเปลี่ยนแปลง
          </p>
        </div>

        <p style="margin: 16px 0 0 0; color: #6b7280; font-size: 12px;">
          ลิงก์นี้จะหมดอายุภายใน 30 นาที
        </p>

        <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 14px;">
          <p style="margin: 5px 0;">© 2025 ระบบศิษย์เก่า วิศวกรรมศาสตร์</p>
          <p style="margin: 5px 0;">มหาวิทยาลัยเทคโนโลยีสุรนารี</p>
          <p style="margin: 15px 0 5px 0; font-size: 12px; color: #9ca3af;">
            อีเมลฉบับนี้เป็นการแจ้งเตือนอัตโนมัติ กรุณาอย่าตอบกลับ
          </p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      ...mailOptions,
      to: email,
      subject: "🔐 รีเซ็ตรหัสผ่าน - ระบบศิษย์เก่าวิศวกรรมศาสตร์",
      html: emailHtml,
    });

    return genericResponse;
  } catch (error) {
    console.error("❌ reset-password email error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดำเนินการ" }, { status: 500 });
  }
}
