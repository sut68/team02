import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Starting data migration...');

  // Get all existing users
  const users = await prisma.$queryRaw<any[]>`
    SELECT * FROM "User"
  `;

  console.log(`Found ${users.length} users to migrate`);

  for (const user of users) {
    console.log(`\nMigrating user: ${user.email}`);

    // Create EducationRecord if user has student info
    if (user.studentCode) {
      try {
        const studyStatus = user.userType === 'alumni' ? 'GRADUATED' : 'ACTIVE';
        await prisma.$executeRaw`
          INSERT INTO "EducationRecord" ("studentCode", "major", "gradYear", "status", "transcript", "userId", "createdAt", "updatedAt")
          VALUES (
            ${user.studentCode},
            ${user.major || 'ไม่ระบุ'},
            ${user.gradYear ? parseInt(user.gradYear) : null},
            ${studyStatus}::"StudyStatus",
            ${user.transcriptUrl},
            ${user.id},
            ${new Date()},
            ${new Date()}
          )
          ON CONFLICT ("studentCode") DO NOTHING
        `;
        console.log(`  ✅ Created EducationRecord for ${user.studentCode}`);
      } catch (error: any) {
        console.log(`  ⚠️  EducationRecord error: ${error.message}`);
      }
    }

    // Create Verification record
    try {
      let verifyStatus = 'PENDING';
      if (user.status === 'approved') verifyStatus = 'APPROVED';
      if (user.status === 'rejected') verifyStatus = 'REJECTED';

      await prisma.$executeRaw`
        INSERT INTO "Verification" ("status", "userId", "createdAt", "updatedAt")
        VALUES (
          ${verifyStatus}::"VerifyStatus",
          ${user.id},
          ${new Date()},
          ${new Date()}
        )
        ON CONFLICT ("userId") DO NOTHING
      `;
      console.log(`  ✅ Created Verification with status ${verifyStatus}`);
    } catch (error: any) {
      console.log(`  ⚠️  Verification error: ${error.message}`);
    }

    // Update User role
    try {
      let role = 'STUDENT';
      if (user.userType === 'alumni') role = 'ALUMNI';
      if (user.email.includes('admin')) role = 'ADMIN';

      await prisma.$executeRaw`
        UPDATE "User"
        SET "role" = ${role}::"Role"
        WHERE "id" = ${user.id}
      `;
      console.log(`  ✅ Updated User role to ${role}`);
    } catch (error: any) {
      console.log(`  ⚠️  Role update error: ${error.message}`);
    }
  }

  console.log('\n✅ Migration completed!');
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
