import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testUpdateStatus() {
  console.log('🧪 ทดสอบการอัปเดตสถานะ Verification\n');

  // 1. หา user ที่เป็น PENDING
  const pendingUser = await prisma.user.findFirst({
    where: {
      role: { not: 'ADMIN' },
      verification: {
        status: 'PENDING'
      }
    },
    include: {
      verification: true,
      educationRecords: true
    }
  });

  if (!pendingUser) {
    console.log('⚠️  ไม่พบผู้ใช้ที่มีสถานะ PENDING');
    console.log('💡 สร้างผู้ใช้ทดสอบ...\n');

    // สร้างผู้ใช้ทดสอบ
    const testUser = await prisma.user.create({
      data: {
        email: `test.pending.${Date.now()}@example.com`,
        password: 'hashedpassword',
        fullName: 'ผู้ใช้ทดสอบ PENDING',
        phone: '0812345678',
        address: 'ที่อยู่ทดสอบ',
        subdistrict: 'ตำบล',
        district: 'อำเภอ',
        province: 'จังหวัด',
        postalCode: '12345',
        role: 'STUDENT',
        educationRecords: {
          create: {
            studentCode: `BTEST${Date.now()}`,
            major: 'วิศวกรรมคอมพิวเตอร์',
            status: 'ACTIVE'
          }
        },
        verification: {
          create: {
            status: 'PENDING'
          }
        }
      },
      include: {
        educationRecords: true,
        verification: true
      }
    });

    console.log('✅ สร้างผู้ใช้ทดสอบสำเร็จ:');
    console.log(`   • ID: ${testUser.id}`);
    console.log(`   • Name: ${testUser.fullName}`);
    console.log(`   • Email: ${testUser.email}`);
    console.log(`   • Verification Status: ${testUser.verification?.status}\n`);

    return testUser;
  }

  console.log('✅ พบผู้ใช้ที่มีสถานะ PENDING:');
  console.log(`   • ID: ${pendingUser.id}`);
  console.log(`   • Name: ${pendingUser.fullName}`);
  console.log(`   • Email: ${pendingUser.email}`);
  console.log(`   • Student Code: ${pendingUser.educationRecords[0]?.studentCode || 'N/A'}`);
  console.log(`   • Verification Status: ${pendingUser.verification?.status}\n`);

  return pendingUser;
}

testUpdateStatus()
  .then(async (user) => {
    console.log('=' .repeat(80));
    console.log('✅ ทดสอบเสร็จสมบูรณ์!');
    console.log(`\n💡 คุณสามารถทดสอบ update status ของผู้ใช้ ID: ${user.id} ได้ในหน้า /admin/usermanage\n`);
    await prisma.$disconnect();
  })
  .catch((error) => {
    console.error('❌ เกิดข้อผิดพลาด:', error);
    process.exit(1);
  });
