import nodemailer from 'nodemailer';

// สร้าง transporter สำหรับ Gmail ด้วย OAuth2
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.GMAIL_USER,
    clientId: process.env.GMAIL_CLIENT_ID,
    clientSecret: process.env.GMAIL_CLIENT_SECRET,
    refreshToken: process.env.GMAIL_REFRESH_TOKEN,
    accessUrl: 'https://oauth2.googleapis.com/token',
  },
});

export async function sendGmailEmail({
  to,
  subject,
  html,
  replyTo,
}: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}) {
  try {
    console.log('📧 กำลังส่งอีเมลผ่าน Gmail...');
    console.log('📮 ส่งไปยัง:', to);
    console.log('📝 หัวข้อ:', subject);

    const info = await transporter.sendMail({
      from: `"${process.env.GMAIL_FROM_NAME || 'ระบบศิษย์เก่าวิศวกรรมศาสตร์'}" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
      replyTo: replyTo || process.env.GMAIL_USER,
    });

    console.log('✅ ส่งอีเมลสำเร็จ!');
    console.log('📧 Message ID:', info.messageId);
    console.log('📨 Response:', info.response);
    
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('❌ ส่งอีเมลล้มเหลว:', error.message);
    
    if (error.message?.includes('Invalid login') || error.message?.includes('invalid_grant')) {
      console.error('\n🔑 ปัญหา: OAuth2 credentials ไม่ถูกต้องหรือหมดอายุ');
      console.error('💡 วิธีแก้:');
      console.error('   1. ตรวจสอบ GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN ใน .env');
      console.error('   2. สร้าง Refresh Token ใหม่ที่: https://developers.google.com/oauthplayground');
      console.error('   3. ตรวจสอบว่า Gmail API เปิดใช้งานใน Google Cloud Console');
    }
    
    if (error.message?.includes('authentication')) {
      console.error('\n🔐 ปัญหา: การยืนยันตัวตน OAuth2 ล้มเหลว');
      console.error('💡 วิธีแก้:');
      console.error('   1. ตรวจสอบว่า OAuth Client ID และ Secret ถูกต้อง');
      console.error('   2. ตรวจสอบว่า Refresh Token ยังใช้งานได้');
    }
    
    return { success: false, error: error.message };
  }
}
