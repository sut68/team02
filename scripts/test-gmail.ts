import 'dotenv/config'; // โหลด .env ก่อน
import { sendGmailEmail } from '../app/lib/gmail';

async function testGmailSend() {
  console.log('🧪 ทดสอบส่งอีเมลผ่าน Gmail OAuth2...\n');
  
  // เช็คว่ามี OAuth2 credentials หรือไม่
  if (!process.env.GMAIL_USER || !process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_CLIENT_SECRET || !process.env.GMAIL_REFRESH_TOKEN) {
    console.error('❌ ไม่พบ OAuth2 credentials ใน .env');
    console.log('💡 กรุณาเพิ่ม:');
    console.log('   - GMAIL_USER');
    console.log('   - GMAIL_CLIENT_ID');
    console.log('   - GMAIL_CLIENT_SECRET');
    console.log('   - GMAIL_REFRESH_TOKEN');
    process.exit(1);
  }
  
  console.log('✅ พบ OAuth2 credentials:');
  console.log('📧 GMAIL_USER:', process.env.GMAIL_USER);
  console.log('🔑 CLIENT_ID:', '***' + process.env.GMAIL_CLIENT_ID.slice(-10));
  console.log('🔑 CLIENT_SECRET:', '***' + process.env.GMAIL_CLIENT_SECRET.slice(-4));
  console.log('🔑 REFRESH_TOKEN:', '***' + process.env.GMAIL_REFRESH_TOKEN.slice(-4));
  console.log('');
  
  const result = await sendGmailEmail({
    to: 'cchutikhan2@gmail.com', // ส่งให้ตัวเองทดสอบ
    subject: '✅ ทดสอบระบบอีเมล OAuth2 - ระบบศิษย์เก่าวิศวกรรมศาสตร์',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f97316 0%, #fb923c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px;">
          <h1>🎉 ทดสอบส่งอีเมล OAuth2 สำเร็จ!</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb; margin-top: 20px; border-radius: 10px;">
          <h2>สวัสดีครับ!</h2>
          <p>ถ้าคุณเห็นอีเมลนี้ แสดงว่าระบบส่งอีเมลผ่าน Gmail OAuth2 ได้สำเร็จแล้ว! ✅</p>
          <p><strong>ข้อมูลการทดสอบ:</strong></p>
          <ul>
            <li>📧 วิธีส่ง: Gmail OAuth2 (ปลอดภัย)</li>
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
  
  if (result.success) {
    console.log('\n✅ ทดสอบสำเร็จ!');
    console.log('📧 ไปเช็คอีเมล cchutikhan2@gmail.com');
    console.log('💡 อย่าลืมดู Spam/Junk folder ด้วย\n');
  } else {
    console.log('\n❌ ทดสอบล้มเหลว');
    console.log('Error:', result.error);
  }
  
  process.exit(0);
}

testGmailSend();
