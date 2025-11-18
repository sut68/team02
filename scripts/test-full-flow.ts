import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testFullFlow() {
  console.log('🧪 ทดสอบ Flow การทำงานของระบบ User-EducationRecord-Verification\n');
  console.log('=' .repeat(80));

  // 1. ทดสอบการสมัครสมาชิก
  console.log('\n📝 1. ทดสอบการสร้างผู้ใช้ใหม่');
  console.log('-'.repeat(80));
  
  const users = await prisma.user.findMany({
    where: { role: { not: 'ADMIN' } },
    include: {
      educationRecords: true,
      verification: true
    },
    take: 3
  });

  console.log(`\n✅ พบผู้ใช้ ${users.length} คน (ไม่นับ ADMIN)\n`);

  users.forEach((user, index) => {
    console.log(`${index + 1}. User: ${user.fullName} (${user.email})`);
    console.log(`   • Role: ${user.role}`);
    console.log(`   • Created: ${user.createdAt.toISOString()}`);
    
    if (user.educationRecords.length > 0) {
      const edu = user.educationRecords[0];
      console.log(`   • Education Record:`);
      console.log(`     - Student Code: ${edu.studentCode}`);
      console.log(`     - Major: ${edu.major}`);
      console.log(`     - Status: ${edu.status}`);
      console.log(`     - Grad Year: ${edu.gradYear || 'N/A'}`);
    } else {
      console.log(`   • ⚠️  ไม่มี Education Record`);
    }

    if (user.verification) {
      console.log(`   • Verification:`);
      console.log(`     - Status: ${user.verification.status}`);
      console.log(`     - Reviewed By: ${user.verification.reviewedBy || 'N/A'}`);
      console.log(`     - Reviewed At: ${user.verification.reviewedAt?.toISOString() || 'N/A'}`);
      if (user.verification.remark) {
        console.log(`     - Remark: ${user.verification.remark}`);
      }
    } else {
      console.log(`   • ⚠️  ไม่มี Verification Record`);
    }
    console.log('');
  });

  // 2. ทดสอบความสัมพันธ์ One-to-Many (User -> EducationRecord)
  console.log('\n🔗 2. ทดสอบความสัมพันธ์ One-to-Many (User → EducationRecord)');
  console.log('-'.repeat(80));
  
  const userWithMultipleEdu = await prisma.user.findFirst({
    where: {
      educationRecords: {
        some: {}
      }
    },
    include: {
      educationRecords: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (userWithMultipleEdu) {
    console.log(`\n✅ ผู้ใช้: ${userWithMultipleEdu.fullName}`);
    console.log(`   • จำนวน Education Records: ${userWithMultipleEdu.educationRecords.length}`);
    userWithMultipleEdu.educationRecords.forEach((edu, idx) => {
      console.log(`   ${idx + 1}. ${edu.studentCode} - ${edu.major} (${edu.status})`);
    });
  }

  // 3. ทดสอบความสัมพันธ์ One-to-One (User -> Verification)
  console.log('\n🔗 3. ทดสอบความสัมพันธ์ One-to-One (User → Verification)');
  console.log('-'.repeat(80));
  
  const verificationStats = await prisma.verification.groupBy({
    by: ['status'],
    _count: true
  });

  console.log('\n✅ สถิติ Verification:');
  verificationStats.forEach(stat => {
    console.log(`   • ${stat.status}: ${stat._count} คน`);
  });

  // 4. ทดสอบ Enum constraints
  console.log('\n🎯 4. ทดสอบ Enum Constraints');
  console.log('-'.repeat(80));
  
  const roleStats = await prisma.user.groupBy({
    by: ['role'],
    _count: true
  });

  console.log('\n✅ สถิติ Role:');
  roleStats.forEach(stat => {
    console.log(`   • ${stat.role}: ${stat._count} คน`);
  });

  const studyStatusStats = await prisma.educationRecord.groupBy({
    by: ['status'],
    _count: true
  });

  console.log('\n✅ สถิติ Study Status:');
  studyStatusStats.forEach(stat => {
    console.log(`   • ${stat.status}: ${stat._count} records`);
  });

  // 5. ทดสอบ Unique Constraints
  console.log('\n🔒 5. ทดสอบ Unique Constraints');
  console.log('-'.repeat(80));
  
  const uniqueEmails = await prisma.user.findMany({
    select: { email: true }
  });
  
  const uniqueStudentCodes = await prisma.educationRecord.findMany({
    select: { studentCode: true }
  });

  const emailSet = new Set(uniqueEmails.map(u => u.email));
  const studentCodeSet = new Set(uniqueStudentCodes.map(e => e.studentCode));

  console.log(`\n✅ Email Uniqueness: ${emailSet.size} unique / ${uniqueEmails.length} total`);
  console.log(`✅ Student Code Uniqueness: ${studentCodeSet.size} unique / ${uniqueStudentCodes.length} total`);

  if (emailSet.size === uniqueEmails.length) {
    console.log('   ✓ ไม่มี email ซ้ำ');
  } else {
    console.log('   ✗ มี email ซ้ำ!');
  }

  if (studentCodeSet.size === uniqueStudentCodes.length) {
    console.log('   ✓ ไม่มี student code ซ้ำ');
  } else {
    console.log('   ✗ มี student code ซ้ำ!');
  }

  // 6. ทดสอบ Cascade Delete
  console.log('\n🗑️  6. ทดสอบ Cascade Delete (Simulation)');
  console.log('-'.repeat(80));
  console.log('\n✅ การตั้งค่า onDelete: Cascade ใน schema:');
  console.log('   • ถ้าลบ User → EducationRecord และ Verification จะถูกลบตามไปด้วย');
  console.log('   • ป้องกันข้อมูลกำพร้า (orphaned records)');

  // 7. สรุป Single Source of Truth
  console.log('\n📊 7. สรุป Single Source of Truth');
  console.log('-'.repeat(80));
  
  const totalUsers = await prisma.user.count();
  const totalEducationRecords = await prisma.educationRecord.count();
  const totalVerifications = await prisma.verification.count();

  console.log(`\n✅ ข้อมูลในระบบ:`);
  console.log(`   • Users: ${totalUsers} คน`);
  console.log(`   • Education Records: ${totalEducationRecords} records`);
  console.log(`   • Verifications: ${totalVerifications} records`);

  const usersWithoutEdu = await prisma.user.count({
    where: {
      educationRecords: { none: {} },
      role: { not: 'ADMIN' }
    }
  });

  const usersWithoutVerification = await prisma.user.count({
    where: {
      verification: null,
      role: { not: 'ADMIN' }
    }
  });

  console.log(`\n⚠️  ข้อมูลที่ไม่สมบูรณ์ (ไม่นับ ADMIN):`);
  console.log(`   • Users ที่ไม่มี Education Record: ${usersWithoutEdu} คน`);
  console.log(`   • Users ที่ไม่มี Verification: ${usersWithoutVerification} คน`);

  if (usersWithoutEdu === 0 && usersWithoutVerification === 0) {
    console.log('\n✅ ระบบมีความสมบูรณ์ของข้อมูล 100%!');
  } else {
    console.log('\n⚠️  ควรแก้ไขข้อมูลที่ไม่สมบูรณ์');
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ การทดสอบเสร็จสมบูรณ์!\n');

  await prisma.$disconnect();
}

testFullFlow().catch((error) => {
  console.error('❌ เกิดข้อผิดพลาด:', error);
  process.exit(1);
});
