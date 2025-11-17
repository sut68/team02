import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUserData() {
  console.log('🔍 กำลังตรวจสอบข้อมูลผู้ใช้...\n');

  // ตรวจสอบผู้ใช้ทั้งหมด
  const allUsers = await prisma.user.findMany({
    include: {
      educationRecords: true,
      verification: true,
    },
  });

  console.log(`📊 พบผู้ใช้ทั้งหมด: ${allUsers.length} คน\n`);

  // หาผู้ใช้ที่ไม่มี educationRecord
  const usersWithoutEducation = allUsers.filter(
    (user) => user.educationRecords.length === 0
  );

  if (usersWithoutEducation.length > 0) {
    console.log(
      `⚠️  พบผู้ใช้ที่ไม่มีข้อมูลการศึกษา: ${usersWithoutEducation.length} คน\n`
    );
    usersWithoutEducation.forEach((user) => {
      console.log(`   - ID: ${user.id}, Email: ${user.email}, Name: ${user.fullName}`);
      console.log(`     Legacy data: studentCode=${user.studentCode}, major=${user.major}, status=${user.status}\n`);
    });

    // ถามว่าต้องการ migrate ข้อมูลหรือไม่
    console.log('💡 แนะนำ: ใช้คำสั่ง npm run migrate-users เพื่อ migrate ข้อมูลเก่าไปยังตารางใหม่');
  } else {
    console.log('✅ ผู้ใช้ทุกคนมีข้อมูลการศึกษาครบถ้วน');
  }

  // แสดงข้อมูลผู้ใช้ทั้งหมด
  console.log('\n📋 รายละเอียดผู้ใช้:\n');
  for (const user of allUsers) {
    console.log(`ID: ${user.id} | ${user.fullName} (${user.email})`);
    console.log(`   Role: ${user.role}`);
    
    if (user.educationRecords.length > 0) {
      const edu = user.educationRecords[0];
      console.log(`   Education: ${edu.studentCode} - ${edu.major} (${edu.status})`);
      if (edu.gradYear) {
        console.log(`   Graduated: ${edu.gradYear}`);
      }
    } else {
      console.log(`   Education: ❌ ไม่มีข้อมูล`);
    }

    if (user.verification) {
      console.log(`   Verification: ${user.verification.status}`);
    } else {
      console.log(`   Verification: ❌ ไม่มีข้อมูล`);
    }
    console.log('');
  }

  await prisma.$disconnect();
}

checkUserData().catch((error) => {
  console.error('❌ เกิดข้อผิดพลาด:', error);
  process.exit(1);
});
