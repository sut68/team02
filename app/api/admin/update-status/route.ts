import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, status, remark } = body;

    if (!userId || !status) {
      return NextResponse.json(
        { error: 'กรุณาระบุ userId และ status' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED'];
    const upperStatus = status.toUpperCase();
    if (!validStatuses.includes(upperStatus)) {
      return NextResponse.json(
        { error: 'สถานะไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: { verification: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'ไม่พบผู้ใช้' },
        { status: 404 }
      );
    }

    // Update or create verification record
    const verification = await prisma.verification.upsert({
      where: { userId: parseInt(userId) },
      update: {
        status: upperStatus as 'PENDING' | 'APPROVED' | 'REJECTED',
        reviewedAt: new Date(),
        remark: remark || null,
        reviewedBy: 'Admin' // TODO: Get actual admin name from session
      },
      create: {
        userId: parseInt(userId),
        status: upperStatus as 'PENDING' | 'APPROVED' | 'REJECTED',
        reviewedAt: new Date(),
        remark: remark || null,
        reviewedBy: 'Admin'
      }
    });

    // Send email notification
    if (upperStatus === 'APPROVED' || upperStatus === 'REJECTED') {
      await sendStatusEmail(user.email, user.fullName, upperStatus, remark);
    }

    return NextResponse.json(
      {
        message: 'อัปเดตสถานะสำเร็จ',
        verification
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

async function sendStatusEmail(email: string, fullName: string, status: string, remark?: string) {
  try {
    // Check if Resend API key exists
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY ไม่ได้ตั้งค่าใน .env');
      console.log('💡 กรุณาตั้งค่าใน .env:');
      console.log('   RESEND_API_KEY=re_xxxxx');
      return;
    }

    const statusText = status === 'APPROVED' ? 'อนุมัติ' : 'ไม่อนุมัติ';
    const statusColor = status === 'APPROVED' ? '#f97316' : '#ef4444';
    const message = status === 'APPROVED' 
      ? 'บัญชีของคุณได้รับการอนุมัติแล้ว คุณสามารถเข้าสู่ระบบได้ทันที'
      : 'ขออภัย บัญชีของคุณไม่ได้รับการอนุมัติ หากต้องการข้อมูลเพิ่มเติม กรุณาติดต่อผู้ดูแลระบบ';

    const htmlContent = `
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
            .remark { background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 15px 0; }
            .warning { background: #fee2e2; padding: 15px; border-left: 4px solid #ef4444; margin: 15px 0; }
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
              <div class="warning">
                <strong>⚠️ ข้อความนี้ส่งผ่าน Gmail</strong><br>
                อีเมลนี้ส่งจากระบบทดสอบ กรุณาตรวจสอบความถูกต้อง
              </div>
              <p>ผลการพิจารณาบัญชีของคุณ:</p>
              <div class="status-badge">${statusText}</div>
              <p>${message}</p>
              ${remark ? `
                <div class="remark">
                  <strong>หมายเหตุจากผู้ตรวจสอบ:</strong><br>
                  ${remark}
                </div>
              ` : ''}
              ${status === 'APPROVED' ? `
                <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/login" class="button">เข้าสู่ระบบ</a>
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
      `;

    const result = await resend.emails.send({
      from: 'ระบบศิษย์เก่าวิศวกรรมศาสตร์ <onboarding@resend.dev>',
      to: email,
      subject: `แจ้งผลการพิจารณาบัญชี - ${statusText}`,
      html: htmlContent,
    });
  } catch (error: any) {
    console.error('❌ ส่งอีเมลล้มเหลว:', error);
    console.error('📋 Error details:', {
      message: error.message,
      statusCode: error.statusCode,
      name: error.name
    });
    
    if (error.message?.includes('API key')) {
      console.log('\n💡 ปัญหา API Key:');
      console.log('   1. ไปที่ https://resend.com สมัครบัญชี (ฟรี)');
      console.log('   2. สร้าง API Key ในแดชบอร์ด');
      console.log('   3. เพิ่มใน .env.local: RESEND_API_KEY=re_xxxxxxxxxxxxx');
      console.log('   4. Restart server (npm run dev)');
    }
    // Don't throw error - allow status update to succeed even if email fails
  }
}
