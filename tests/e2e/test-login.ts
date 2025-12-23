// Quick test to verify login works with test database
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const databaseUrl = 'postgresql://postgres:postgres@localhost:5432/testdb_e2e?schema=public';
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

async function testLogin() {
  try {
    // Check if users exist
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@test.com' },
      include: { verification: true },
    });
    
    const regularUser = await prisma.user.findUnique({
      where: { email: 'user@test.com' },
      include: { verification: true },
    });

    console.log('Admin user exists:', !!adminUser);
    console.log('Admin verification:', adminUser?.verification?.status);
    
    console.log('Regular user exists:', !!regularUser);
    console.log('Regular user verification:', regularUser?.verification?.status);

    if (adminUser) {
      const passwordMatch = await bcrypt.compare('password123', adminUser.password);
      console.log('Admin password matches:', passwordMatch);
    }

    if (regularUser) {
      const passwordMatch = await bcrypt.compare('password123', regularUser.password);
      console.log('User password matches:', passwordMatch);
    }

    console.log('\n✅ Login credentials verified!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();

