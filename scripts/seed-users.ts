import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedUsers() {
  try {
    console.log('🌱 Seeding users for all roles...');

    // Admin
    const admin = await prisma.user.upsert({
      where: { email: 'admin@sut.ac.th' },
      update: {},
      create: {
        email: 'admin@sut.ac.th',
        password: await bcrypt.hash('admin123', 10),
        role: 'ADMIN',
        fullName: 'ผู้ดูแลระบบ',
        phone: '0812345678',
        address: 'มหาวิทยาลัยเทคโนโลยีสุรนารี',
        subdistrict: 'สุรนารี',
        district: 'เมือง',
        province: 'นครราชสีมา',
        postalCode: '30000',
      },
    });

    // Student (APPROVED)
    const student = await prisma.user.upsert({
      where: { email: 'student@example.com' },
      update: {},
      create: {
        email: 'student@example.com',
        password: await bcrypt.hash('student123', 10),
        role: 'STUDENT',
        fullName: 'นักศึกษาทดสอบ',
        phone: '0812345678',
        address: '123 ถนนสุรนารายณ์',
        subdistrict: 'ในเมือง',
        district: 'เมือง',
        province: 'นครราชสีมา',
        postalCode: '30000',
        educationRecords: {
          create: {
            studentCode: 'B6610456',
            major: 'วิศวกรรมคอมพิวเตอร์',
            status: 'ACTIVE',
            gradYear: undefined,
          },
        },
        verification: {
          create: {
            status: 'APPROVED',
            reviewedBy: 'Seeder',
            reviewedAt: new Date(),
          },
        },
      },
      include: { educationRecords: true, verification: true },
    });

    // Alumni (APPROVED)
    const alumni = await prisma.user.upsert({
      where: { email: 'alumni@example.com' },
      update: {},
      create: {
        email: 'alumni@example.com',
        password: await bcrypt.hash('alumni123', 10),
        role: 'ALUMNI',
        fullName: 'ศิษย์เก่าทดสอบ',
        phone: '0898765432',
        address: '456 ถนนมิตรภาพ',
        subdistrict: 'ในเมือง',
        district: 'เมือง',
        province: 'นครราชสีมา',
        postalCode: '30000',
        educationRecords: {
          create: {
            studentCode: 'B5512345',
            major: 'วิศวกรรมไฟฟ้า',
            status: 'GRADUATED',
            gradYear: 2020,
            transcript: 'path/to/transcript.pdf',
          },
        },
        verification: {
          create: {
            status: 'APPROVED',
            reviewedBy: 'Seeder',
            reviewedAt: new Date(),
          },
        },
      },
      include: { educationRecords: true, verification: true },
    });

    // Pending student (PENDING)
    const pending = await prisma.user.upsert({
      where: { email: 'pending@student.com' },
      update: {},
      create: {
        email: 'pending@student.com',
        password: await bcrypt.hash('pending123', 10),
        role: 'STUDENT',
        fullName: 'ผู้ใช้รออนุมัติ',
        phone: '0800000000',
        address: '789 ถนนมิตรภาพ',
        subdistrict: 'ในเมือง',
        district: 'เมือง',
        province: 'นครราชสีมา',
        postalCode: '30000',
        educationRecords: {
          create: {
            studentCode: 'B6799999',
            major: 'วิศวกรรมอุตสาหการ',
            status: 'ACTIVE',
            gradYear: undefined,
          },
        },
        verification: {
          create: {
            status: 'PENDING',
          },
        },
      },
      include: { educationRecords: true, verification: true },
    });

    console.log('\n✅ Seed completed');
    console.log('   • ADMIN    -> admin@sut.ac.th / admin123');
    console.log('   • STUDENT  -> student@example.com / student123 (APPROVED)');
    console.log('   • ALUMNI   -> alumni@example.com / alumni123 (APPROVED)');
    console.log('   • PENDING  -> pending@student.com / pending123 (PENDING)');
  } catch (e) {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedUsers();
