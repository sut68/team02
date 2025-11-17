import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  const email = 'admin@sut.ac.th'; // เปลี่ยนเป็น email ที่ต้องการ
  const password = 'admin123'; // เปลี่ยนเป็นรหัสผ่านที่ต้องการ
  const fullName = 'ผู้ดูแลระบบ';

  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      console.log('❌ อีเมลนี้มีในระบบแล้ว:', email);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        phone: '0812345678',
        address: 'มหาวิทยาลัยเทคโนโลยีสุรนารี',
        subdistrict: 'สุรนารี',
        district: 'เมือง',
        province: 'นครราชสีมา',
        postalCode: '30000',
        userType: 'admin', // สำคัญ: ตั้งเป็น admin
        status: 'approved', // อนุมัติทันที
      },
    });

    console.log('✅ สร้าง Admin สำเร็จ!');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('👤 ชื่อ:', fullName);
    console.log('\nสามารถเข้าสู่ระบบได้ที่: /auth/login');
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
