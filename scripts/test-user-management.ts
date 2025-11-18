import { prisma } from '../app/lib/prisma';

async function testUserManagement() {
  try {
    console.log('🧪 Testing User Management Page Data...\n');

    // 1. Test fetching users
    console.log('📊 Fetching users (excluding ADMIN)...');
    const users = await prisma.user.findMany({
      where: {
        role: {
          not: 'ADMIN'
        }
      },
      include: {
        educationRecords: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        },
        verification: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`✅ Found ${users.length} users\n`);

    // 2. Display user info
    users.forEach((user, index) => {
      console.log(`User ${index + 1}:`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Name: ${user.fullName}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Role: ${user.role}`);
      
      if (user.educationRecords[0]) {
        console.log(`  Student Code: ${user.educationRecords[0].studentCode}`);
        console.log(`  Major: ${user.educationRecords[0].major}`);
        console.log(`  Status: ${user.educationRecords[0].status}`);
      }
      
      if (user.verification) {
        console.log(`  Verification Status: ${user.verification.status}`);
        if (user.verification.reviewedAt) {
          console.log(`  Reviewed At: ${user.verification.reviewedAt.toISOString()}`);
        }
        if (user.verification.remark) {
          console.log(`  Remark: ${user.verification.remark}`);
        }
      } else {
        console.log(`  Verification Status: PENDING (no record)`);
      }
      console.log('');
    });

    // 3. Test verification status counts
    console.log('📈 Verification Status Summary:');
    const pendingCount = users.filter(u => !u.verification || u.verification.status === 'PENDING').length;
    const approvedCount = users.filter(u => u.verification?.status === 'APPROVED').length;
    const rejectedCount = users.filter(u => u.verification?.status === 'REJECTED').length;
    
    console.log(`  All: ${users.length}`);
    console.log(`  Pending: ${pendingCount}`);
    console.log(`  Approved: ${approvedCount}`);
    console.log(`  Rejected: ${rejectedCount}`);
    
    console.log('\n✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testUserManagement();
