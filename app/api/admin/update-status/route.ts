import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, status } = body;

    if (!userId || !status) {
      return NextResponse.json(
        { error: 'กรุณาระบุ userId และ status' },
        { status: 400 }
      );
    }

    // Update user status in database
    const user = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { status },
    });

    // Send email notification
    if (status === 'approved' || status === 'rejected') {
      await sendStatusEmail(user.email, user.fullName, status);
    }

    return NextResponse.json(
      {
        message: 'อัปเดตสถานะสำเร็จ',
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          status: user.status,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update status error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัปเดตสถานะ' },
      { status: 500 }
    );
  }
}

async function sendStatusEmail(email: string, fullName: string, status: string) {
  try {
    const statusText = status === 'approved' ? 'อนุมัติ' : 'ไม่อนุมัติ';
    const statusColor = status === 'approved' ? '#f97316' : '#ef4444';
    const message = status === 'approved' 
      ? 'บัญชีของคุณได้รับการอนุมัติแล้ว คุณสามารถเข้าสู่ระบบได้ทันที'
      : 'ขออภัย บัญชีของคุณไม่ได้รับการอนุมัติ หากต้องการข้อมูลเพิ่มเติม กรุณาติดต่อผู้ดูแลระบบ';

    await resend.emails.send({
      from: 'ระบบศิษย์เก่าวิศวกรรมศาสตร์ <onboarding@resend.dev>',
      to: email,
      subject: `แจ้งผลการพิจารณาบัญชี - ${statusText}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Sarabun', 'Noto Sans Thai', Arial, sans-serif; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f97316 0%, #fb923c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
            .status-badge { display: inline-block; padding: 10px 20px; background: ${statusColor}; color: white; border-radius: 5px; font-weight: bold; margin: 20px 0; }
            .button { display: inline-block; padding: 12px 30px; background: #f97316; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>ระบบศิษย์เก่า วิศวกรรมศาสตร์</h1>
              <p>มหาวิทยาลัยเทคโนโลยีสุรนารี</p>
            </div>
            <div class="content">
              <h2>สวัสดี คุณ ${fullName}</h2>
              <p>ผลการพิจารณาบัญชีของคุณ:</p>
              <div class="status-badge">${statusText}</div>
              <p>${message}</p>
              ${status === 'approved' ? `
                <a href="${process.env.NEXTAUTH_URL}/auth/login" class="button">เข้าสู่ระบบ</a>
              ` : ''}
              <p style="margin-top: 30px;">หากมีข้อสงสัย กรุณาติดต่อ:</p>
              <p>📧 Email: ${process.env.NEXT_PUBLIC_EMAIL || 'ieadmin@g.sut.ac.th'}<br>
              📞 โทร: ${process.env.NEXT_PUBLIC_PHONE_DISPLAY || '+66 4422 4224'}</p>
            </div>
            <div class="footer">
              <p>© 2025 ระบบศิษย์เก่า วิศวกรรมศาสตร์ มหาวิทยาลัยเทคโนโลยีสุรนารี</p>
              <p>อีเมลนี้ถูกส่งโดยอัตโนมัติ กรุณาอย่าตอบกลับ</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log(`✅ ส่งอีเมลไปยัง ${email} สำเร็จ`);
  } catch (error) {
    console.error('❌ ส่งอีเมลล้มเหลว:', error);
    // Don't throw error - allow status update to succeed even if email fails
  }
}
