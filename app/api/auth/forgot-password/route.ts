import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { transporter, mailOptions } from '@/app/lib/nodemailer';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'กรุณากรอกอีเมล' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่ามี user นี้หรือไม่
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // ถึงแม้ไม่เจอ user ก็ return success เพื่อป้องกัน email enumeration
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'หากอีเมลนี้มีในระบบ เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปแล้ว',
      });
    }

    // สร้าง reset token (random 32 bytes)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // หมดอายุใน 1 ชั่วโมง

    // ลบ token เก่าทั้งหมดของ user นี้ (ทั้งที่ใช้และยังไม่ใช้)
    await prisma.passwordReset.deleteMany({
      where: {
        userId: user.id,
      },
    });

    // สร้าง password reset record
    await prisma.passwordReset.create({
      data: {
        token: resetToken,
        userId: user.id,
        expiresAt,
      },
    });

    // สร้าง reset URL
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;

    // ส่งอีเมล
    const emailHtml = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background: linear-gradient(135deg, #f97316 0%, #fb923c 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 15px 15px 0 0; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h1 style="margin: 0; font-size: 28px;">🔐 รีเซ็ตรหัสผ่าน</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">ระบบศิษย์เก่าวิศวกรรมศาสตร์</p>
        </div>
        
        <div style="background: white; padding: 40px 30px; border-radius: 0 0 15px 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">สวัสดีคุณ ${user.fullName} 👋</h2>
          <p style="color: #555; line-height: 1.6; font-size: 16px;">
            เราได้รับคำขอให้รีเซ็ตรหัสผ่านสำหรับบัญชีของคุณ
          </p>
          
          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #856404; font-size: 14px;">
              <strong>⚠️ หมายเหตุ:</strong> ลิงก์นี้จะหมดอายุใน <strong>1 ชั่วโมง</strong>
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #fb923c 100%); 
                      color: white; padding: 15px 40px; text-decoration: none; border-radius: 10px; 
                      font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(249, 115, 22, 0.3);">
              🔑 รีเซ็ตรหัสผ่าน
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
        </div>
        
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
      subject: '🔐 รีเซ็ตรหัสผ่าน - ระบบศิษย์เก่าวิศวกรรมศาสตร์',
      html: emailHtml,
    });

    console.log(`✅ ส่งอีเมลรีเซ็ตรหัสผ่านไปที่ ${email}`);

    return NextResponse.json({
      success: true,
      message: 'หากอีเมลนี้มีในระบบ เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปแล้ว',
    });
  } catch (error: any) {
    console.error('❌ เกิดข้อผิดพลาดในการส่งอีเมลรีเซ็ตรหัสผ่าน:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดำเนินการ' },
      { status: 500 }
    );
  }
}
