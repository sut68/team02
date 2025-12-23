import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Global container storage
let globalContainer: StartedPostgreSqlContainer | null = null;
let globalDatabaseUrl: string | null = null;

export async function startTestContainer(): Promise<string> {
  // Return existing container if already started
  if (globalContainer && globalDatabaseUrl) {
    return globalDatabaseUrl;
  }

  console.log('🐳 Starting PostgreSQL test container...');

  const container = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('testdb')
    .withUsername('testuser')
    .withPassword('testpass')
    .start();

  globalDatabaseUrl = container.getConnectionUri();
  globalContainer = container;
  console.log(`✅ PostgreSQL container started: ${globalDatabaseUrl}`);

  // Push schema
  console.log('🔄 Pushing Prisma schema...');
  execSync('npx prisma db push --accept-data-loss --skip-generate', {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: globalDatabaseUrl,
    },
  });

  // Seed test data using Prisma
  console.log('🌱 Seeding test data...');

  const prisma = new PrismaClient({
    datasources: { db: { url: globalDatabaseUrl } },
  });

  try {
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create admin user (no verification needed)
    await prisma.user.create({
      data: {
        email: 'admin@test.com',
        password: hashedPassword,
        fullName: 'Test Admin',
        phone: '0812345678',
        address: '123 Test St',
        subdistrict: 'Test',
        district: 'Test',
        province: 'Test',
        postalCode: '10000',
        role: 'ADMIN',
        status: 'approved',
      },
    });

    // Create regular user with APPROVED verification
    const regularUser = await prisma.user.create({
      data: {
        email: 'user@test.com',
        password: hashedPassword,
        fullName: 'Test User',
        phone: '0812345679',
        address: '456 Test Ave',
        subdistrict: 'Test',
        district: 'Test',
        province: 'Test',
        postalCode: '10000',
        role: 'STUDENT',
        status: 'approved',
      },
    });

    // Create APPROVED verification for regular user
    await prisma.verification.create({
      data: {
        userId: regularUser.id,
        status: 'APPROVED',
        reviewedBy: 'Test Admin',
        reviewedAt: new Date(),
      },
    });

    // Create job types
    // @ts-expect-error - Prisma types don't work with dynamic datasources
    await prisma.jobType.createMany({
      data: [
        { typename: 'FULL_TIME' },
        { typename: 'PART_TIME' },
        { typename: 'CONTRACT' },
        { typename: 'INTERNSHIP' },
      ],
    });

    console.log('✅ Test data seeded');
  } finally {
    await prisma.$disconnect();
  }

  return globalDatabaseUrl;
}

export async function stopTestContainer(): Promise<void> {
  if (globalContainer) {
    console.log('🛑 Stopping PostgreSQL container...');
    await globalContainer.stop();
    globalContainer = null;
    globalDatabaseUrl = null;
    console.log('✅ Container stopped');
  }
}

export function getTestDatabaseUrl(): string {
  if (!globalDatabaseUrl) {
    throw new Error('No container started. Call startTestContainer() first.');
  }

  return globalDatabaseUrl;
}

export async function cleanupTestData(): Promise<void> {
  if (!globalDatabaseUrl) return;

  const prisma = new PrismaClient({
    datasources: { db: { url: globalDatabaseUrl } },
  });

  try {
    // Delete in correct order due to foreign keys
    // @ts-expect-error - Prisma types don't work with dynamic datasources
    await prisma.jobEditHistory.deleteMany();
    // @ts-expect-error - Prisma types don't work with dynamic datasources
    await prisma.approvalLog.deleteMany();
    // @ts-expect-error - Prisma types don't work with dynamic datasources
    await prisma.company.deleteMany();
    // @ts-expect-error - Prisma types don't work with dynamic datasources
    await prisma.jobPosting.deleteMany();
  } finally {
    await prisma.$disconnect();
  }
}
