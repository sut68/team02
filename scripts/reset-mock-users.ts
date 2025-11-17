import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Deleting old mock users...');

  // ลบ user เก่า
  await prisma.user.deleteMany({
    where: {
      email: {
        in: ['student@example.com', 'alumni@example.com']
      }
    }
  });

  console.log('✅ Old users deleted\n');
  console.log('📝 Creating new mock users...');

  // Mock user credentials
  const studentEmail = 'student@example.com';
  const studentPassword = 'student123';

  const alumniEmail = 'alumni@example.com';
  const alumniPassword = 'alumni123';

  // Hash passwords
  const hashedStudentPassword = await bcrypt.hash(studentPassword, 10);
  const hashedAlumniPassword = await bcrypt.hash(alumniPassword, 10);

  // สร้าง STUDENT
  const student = await prisma.user.create({
    data: {
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

  // สร้าง ALUMNI
  const alumni = await prisma.user.create({
    data: {
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

  console.log('✅ Mock users created successfully!\n');
  console.log('========================================');
  console.log('📧 STUDENT Account:');
  console.log('   Email:    student@example.com');
  console.log('   Password: student123');
  console.log('   Status:   approved ✓');
  console.log('========================================');
  console.log('📧 ALUMNI Account:');
  console.log('   Email:    alumni@example.com');
  console.log('   Password: alumni123');
  console.log('   Status:   approved ✓');
  console.log('========================================\n');
  
  console.log('Created users:', {
    student: { id: student.id, email: student.email, status: student.status },
    alumni: { id: alumni.id, email: alumni.email, status: alumni.status }
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
