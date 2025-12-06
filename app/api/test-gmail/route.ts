import { NextRequest, NextResponse } from 'next/server';
import { transporter, mailOptions } from '@/app/lib/nodemailer';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 ทดสอบส่งอีเมลผ่าน Gmail OAuth2...');
    console.log('📧 GMAIL_USER:', process.env.GMAIL_USER ? '✅ มี' : '❌ ไม่มี');
    console.log('🔑 GMAIL_CLIENT_ID:', process.env.GMAIL_CLIENT_ID ? '✅ มี' : '❌ ไม่มี');
    console.log('🔒 GMAIL_CLIENT_SECRET:', process.env.GMAIL_CLIENT_SECRET ? '✅ มี' : '❌ ไม่มี');
    console.log('🔄 GMAIL_REFRESH_TOKEN:', process.env.GMAIL_REFRESH_TOKEN ? '✅ มี' : '❌ ไม่มี');

    // ทดสอบส่งอีเมล
    const result = await transporter.sendMail({
      ...mailOptions,
      to: process.env.GMAIL_USER,
      subject: '✅ ทดสอบส่งอีเมล - Gmail OAuth2',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background: linear-gradient(135deg, #f97316 0%, #fb923c 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 15px 15px 0 0; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h1 style="margin: 0; font-size: 32px;">🎉 ทดสอบส่งอีเมลสำเร็จ!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Gmail OAuth2 - Nodemailer</p>
          </div>
          
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 15px 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0;">สวัสดีครับ! 👋</h2>
            <p style="color: #555; line-height: 1.6; font-size: 16px;">
              ถ้าคุณเห็นอีเมลนี้ แสดงว่า<strong style="color: #f97316;"> ระบบส่งอีเมลผ่าน Gmail OAuth2 ได้สำเร็จแล้ว!</strong> ✅
            </p>
            
            <div style="background: #f9fafb; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #f97316;">
              <h3 style="margin-top: 0; color: #333;">📊 ข้อมูลการทดสอบ:</h3>
              <ul style="color: #555; line-height: 2;">
                <li>📧 <strong>วิธีส่ง:</strong> Gmail OAuth2 (Nodemailer)</li>
                <li>⏰ <strong>เวลา:</strong> ${new Date().toLocaleString('th-TH', { 
                  timeZone: 'Asia/Bangkok',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}</li>
                <li>🔐 <strong>Authentication:</strong> OAuth2</li>
                <li>🔧 <strong>สถานะ:</strong> <span style="color: #10b981; font-weight: bold;">พร้อมใช้งาน</span></li>
              </ul>
            </div>

            <div style="background: linear-gradient(135deg, #10b981 0%, #34d399 100%); color: white; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
              <p style="margin: 0; font-size: 18px; font-weight: bold;">
                🎊 ตอนนี้สามารถใช้ระบบแจ้งเตือนอีเมลได้แล้ว!
              </p>
            </div>

            <div style="background: #fff3cd; border: 2px solid #ffc107; border-radius: 10px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #856404;">
                <strong>💡 หมายเหตุ:</strong> ระบบใช้ Gmail OAuth2 ซึ่งปลอดภัยกว่า App Password และไม่ต้องกังวลเรื่อง token หมดอายุ
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
      `,
    });

    console.log('✅ ส่งอีเมลสำเร็จ!');
    console.log('📧 Message ID:', result.messageId);
    console.log('📬 Response:', result.response);

    return NextResponse.json({
      success: true,
      message: `ส่งอีเมลสำเร็จผ่าน Gmail OAuth2! เช็คที่ ${process.env.GMAIL_USER}`,
      messageId: result.messageId,
      response: result.response,
    });
  } catch (error: any) {
    console.error('❌ ส่งอีเมลล้มเหลว:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'เกิดข้อผิดพลาดในการส่งอีเมล',
      details: {
        name: error.name,
        code: error.code,
        command: error.command,
      }
    }, { status: 500 });
  }
}
