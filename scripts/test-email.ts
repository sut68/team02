import { prisma } from '../app/lib/prisma';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmailNotification() {
  try {
    console.log('🔍 กำลังค้นหาผู้ใช้ที่มีสถานะ pending...');
    
    // หาผู้ใช้ที่มีสถานะ pending
    const user = await prisma.user.findFirst({
      where: { status: 'pending' },
    });

    if (!user) {
      console.log('❌ ไม่พบผู้ใช้ที่มีสถานะ pending');
      console.log('💡 ลองสร้างผู้ใช้ใหม่ที่หน้า /auth/register ก่อน');
      return;
    }

    console.log(`\n✅ พบผู้ใช้: ${user.fullName} (${user.email})`);
    console.log(`📊 สถานะปัจจุบัน: ${user.status}`);
    
    // อัปเดตสถานะเป็น approved
    console.log('\n🔄 กำลังอัปเดตสถานะเป็น "approved"...');
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { status: 'approved' },
    });

    console.log('✅ อัปเดตสถานะสำเร็จ!');
    
    // ส่งอีเมล
    console.log('\n📧 กำลังส่งอีเมลแจ้งเตือน...');
    console.log('🔑 API Key:', process.env.RESEND_API_KEY ? 'มีอยู่' : '❌ ไม่มี');
    
    const result = await resend.emails.send({
      from: 'ระบบศิษย์เก่าวิศวกรรมศาสตร์ <onboarding@resend.dev>',
      to: user.email,
      subject: 'แจ้งผลการพิจารณาบัญชี - อนุมัติ',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Sarabun', 'Noto Sans Thai', Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f97316 0%, #fb923c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
            .status-badge { display: inline-block; padding: 10px 20px; background: #f97316; color: white; border-radius: 5px; font-weight: bold; margin: 20px 0; }
            .button { display: inline-block; padding: 12px 30px; background: #f97316; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 ระบบศิษย์เก่า วิศวกรรมศาสตร์</h1>
              <p>มหาวิทยาลัยเทคโนโลยีสุรนารี</p>
            </div>
            <div class="content">
              <h2>สวัสดี คุณ ${user.fullName}</h2>
              <p>ผลการพิจารณาบัญชีของคุณ:</p>
              <div class="status-badge">✅ อนุมัติแล้ว</div>
              <p><strong>บัญชีของคุณได้รับการอนุมัติแล้ว!</strong></p>
              <p>คุณสามารถเข้าสู่ระบบและใช้งานได้ทันที</p>
              <a href="${process.env.NEXTAUTH_URL}/auth/login" class="button">เข้าสู่ระบบทันที</a>
              <p style="margin-top: 30px;">หากมีข้อสงสัย กรุณาติดต่อ:</p>
              <p>📧 Email: ieadmin@g.sut.ac.th<br>
              📞 โทร: +66 4422 4224</p>
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

    console.log('\n🎉 สำเร็จ! ส่งอีเมลแล้ว');
    console.log('📧 Email ID:', result.data?.id);
    console.log('📦 Full Response:', JSON.stringify(result, null, 2));
    console.log('📮 ส่งไปยัง:', user.email);
    console.log('\n💡 ตรวจสอบกล่องจดหมายของคุณ (รวมถึง Spam/Junk)');
    
  } catch (error: any) {
    console.error('\n❌ เกิดข้อผิดพลาด:', error.message);
    if (error.message?.includes('RESEND_API_KEY')) {
      console.log('\n💡 กรุณาตั้งค่า RESEND_API_KEY ในไฟล์ .env');
      console.log('   ไปที่ https://resend.com เพื่อสมัครและสร้าง API Key (ฟรี)');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testEmailNotification();
