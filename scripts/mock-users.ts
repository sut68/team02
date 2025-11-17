import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding mock users...');

  // Mock user credentials
  const studentEmail = 'student@example.com';
  const studentPassword = 'student123'; // Plaintext password: student123

  const alumniEmail = 'alumni@example.com';
  const alumniPassword = 'alumni123'; // Plaintext password: alumni123

  // Hash passwords
  const hashedStudentPassword = await bcrypt.hash(studentPassword, 10);
  const hashedAlumniPassword = await bcrypt.hash(alumniPassword, 10);

  const student = await prisma.user.upsert({
    where: { email: studentEmail },
    update: {},
    create: {
      email: studentEmail,
      password: hashedStudentPassword,
      role: 'STUDENT',
      fullName: 'นักศึกษาทดสอบ',
      phone: '0812345678',
      address: '123 ถนนสุรนารายณ์',
      subdistrict: 'ในเมือง',
      district: 'เมือง',
      province: 'นครราชสีมา',
      postalCode: '30000',
      studentCode: 'B6610456',
      major: 'วิศวกรรมคอมพิวเตอร์',
      gradYear: null,
      transcriptUrl: null,
      userType: 'student',
      status: 'approved',
    },
  });

  const alumni = await prisma.user.upsert({
    where: { email: alumniEmail },
    update: {},
    create: {
      email: alumniEmail,
      password: hashedAlumniPassword,
      role: 'ALUMNI',
      fullName: 'ศิษย์เก่าทดสอบ',
      phone: '0898765432',
      address: '456 ถนนมิตรภาพ',
      subdistrict: 'ในเมือง',
      district: 'เมือง',
      province: 'นครราชสีมา',
      postalCode: '30000',
      studentCode: 'B5512345',
      major: 'วิศวกรรมไฟฟ้า',
      gradYear: '2020',
      transcriptUrl: 'path/to/transcript.pdf',
      userType: 'alumni',
      status: 'approved',
    },
  });

  console.log('✅ Mock users seeded successfully!\n');
  console.log('========================================');
  console.log('📧 STUDENT Account:');
  console.log('   Email:    student@example.com');
  console.log('   Password: student123');
  console.log('========================================');
  console.log('📧 ALUMNI Account:');
  console.log('   Email:    alumni@example.com');
  console.log('   Password: alumni123');
  console.log('========================================\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });