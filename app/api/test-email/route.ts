import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 ทดสอบส่งอีเมล...');
    console.log('📧 RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✅ มี' : '❌ ไม่มี');

    const result = await resend.emails.send({
      from: 'ระบบศิษย์เก่าวิศวกรรมศาสตร์ <onboarding@resend.dev>',
      to: 'cchutikhan2@gmail.com',
      subject: '✅ ทดสอบส่งอีเมล - ระบบศิษย์เก่าวิศวกรรมศาสตร์',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f97316 0%, #fb923c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px;">
            <h1>🎉 ทดสอบส่งอีเมลสำเร็จ!</h1>
          </div>
          <div style="padding: 30px; background: #f9fafb; margin-top: 20px; border-radius: 10px;">
            <h2>สวัสดีครับ!</h2>
            <p>ถ้าคุณเห็นอีเมลนี้ แสดงว่าระบบส่งอีเมลผ่าน Resend ได้สำเร็จแล้ว! ✅</p>
            <p><strong>ข้อมูลการทดสอบ:</strong></p>
            <ul>
              <li>📧 วิธีส่ง: Resend API</li>
              <li>⏰ เวลา: ${new Date().toLocaleString('th-TH')}</li>
              <li>🔧 สถานะ: พร้อมใช้งาน</li>
            </ul>
            <p style="color: #f97316; font-weight: bold;">ตอนนี้สามารถใช้ระบบแจ้งเตือนอีเมลได้แล้ว!</p>
          </div>
          <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 14px;">
            <p>© 2025 ระบบศิษย์เก่า วิศวกรรมศาสตร์ มหาวิทยาลัยเทคโนโลยีสุรนารี</p>
          </div>
        </div>
      `,
    });

    console.log('✅ ส่งอีเมลสำเร็จ!');
    console.log('📧 Message ID:', result.data?.id);

    return NextResponse.json({
      success: true,
      message: 'ส่งอีเมลสำเร็จ! เช็คที่ cchutikhan2@gmail.com (รวม Spam folder)',
      messageId: result.data?.id,
    });
  } catch (error: any) {
    console.error('❌ ส่งอีเมลล้มเหลว:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error,
    }, { status: 500 });
  }
}
