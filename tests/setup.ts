import { vi } from 'vitest';

// Mock Prisma Client
const mockPrisma = {
  jobPosting: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  jobType: {
    findUnique: vi.fn(),
    create: vi.fn(),
    upsert: vi.fn(),
  },
  company: {
    create: vi.fn(),
  },
  approvalLog: {
    create: vi.fn(),
  },
};

vi.mock('@/app/lib/prisma', () => ({
  prisma: mockPrisma,
}));

// Mock file system operations
vi.mock('fs', () => ({
  promises: {
    mkdir: vi.fn(),
    writeFile: vi.fn(),
  },
}));

// Mock path module
vi.mock('path', () => ({
  default: {
    join: (...args: string[]) => args.join('/'),
  },
}));

