import { prisma } from '../app/lib/prisma';

async function testUpdateStatus() {
  try {
    console.log('🧪 Testing Update Status API...\n');

    // Find a test user
    const testUser = await prisma.user.findFirst({
      where: {
        email: 'student@example.com'
      },
      include: {
        verification: true
      }
    });

    if (!testUser) {
      console.log('❌ Test user not found');
      return;
    }

    console.log('📝 Test User Info:');
    console.log(`  ID: ${testUser.id}`);
    console.log(`  Name: ${testUser.fullName}`);
    console.log(`  Email: ${testUser.email}`);
    console.log(`  Current Status: ${testUser.verification?.status || 'PENDING'}`);
    console.log('');

    // Test 1: Update to PENDING
    console.log('Test 1: Updating status to PENDING...');
    const result1 = await prisma.verification.upsert({
      where: { userId: testUser.id },
      update: {
        status: 'PENDING',
        reviewedAt: new Date(),
        remark: null,
        reviewedBy: 'Test Admin'
      },
      create: {
        userId: testUser.id,
        status: 'PENDING',
        reviewedAt: new Date(),
        remark: null,
        reviewedBy: 'Test Admin'
      }
    });
    console.log(`✅ Status updated to: ${result1.status}\n`);

    // Test 2: Update to APPROVED
    console.log('Test 2: Updating status to APPROVED...');
    const result2 = await prisma.verification.upsert({
      where: { userId: testUser.id },
      update: {
        status: 'APPROVED',
        reviewedAt: new Date(),
        remark: null,
        reviewedBy: 'Test Admin'
      },
      create: {
        userId: testUser.id,
        status: 'APPROVED',
        reviewedAt: new Date(),
        remark: null,
        reviewedBy: 'Test Admin'
      }
    });
    console.log(`✅ Status updated to: ${result2.status}\n`);

    // Test 3: Update to REJECTED with remark
    console.log('Test 3: Updating status to REJECTED with remark...');
    const result3 = await prisma.verification.upsert({
      where: { userId: testUser.id },
      update: {
        status: 'REJECTED',
        reviewedAt: new Date(),
        remark: 'ข้อมูลไม่ครบถ้วน กรุณาตรวจสอบใบ transcript',
        reviewedBy: 'Test Admin'
      },
      create: {
        userId: testUser.id,
        status: 'REJECTED',
        reviewedAt: new Date(),
        remark: 'ข้อมูลไม่ครบถ้วน กรุณาตรวจสอบใบ transcript',
        reviewedBy: 'Test Admin'
      }
    });
    console.log(`✅ Status updated to: ${result3.status}`);
    console.log(`   Remark: ${result3.remark}\n`);

    // Test 4: Restore to APPROVED
    console.log('Test 4: Restoring status to APPROVED...');
    const result4 = await prisma.verification.upsert({
      where: { userId: testUser.id },
      update: {
        status: 'APPROVED',
        reviewedAt: new Date(),
        remark: null,
        reviewedBy: 'Test Admin'
      },
      create: {
        userId: testUser.id,
        status: 'APPROVED',
        reviewedAt: new Date(),
        remark: null,
        reviewedBy: 'Test Admin'
      }
    });
    console.log(`✅ Status restored to: ${result4.status}\n`);

    console.log('✅ All tests passed successfully!');
    console.log('\n💡 Next step: Test the API endpoint via HTTP request');
    console.log('   Example using curl:');
    console.log(`   curl -X PATCH http://localhost:3000/api/admin/update-status \\`);
    console.log(`        -H "Content-Type: application/json" \\`);
    console.log(`        -d '{"userId":"${testUser.id}","status":"APPROVED","remark":""}'`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testUpdateStatus();
