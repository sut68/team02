import '@testing-library/jest-dom';

// Mock Prisma Client
const mockPrisma = {
  jobPosting: {
    create: jest.fn(), // เปลี่ยน vi -> jest
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  jobType: {
    findUnique: jest.fn(),
    create: jest.fn(),
    upsert: jest.fn(),
  },
  company: {
    create: jest.fn(),
  },
  approvalLog: {
    create: jest.fn(),
  },
};

// เปลี่ยน vi.mock -> jest.mock
jest.mock('@/app/lib/prisma', () => ({
  prisma: mockPrisma,
}));

// Mock file system operations
jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn(),
    writeFile: jest.fn(),
  },
}));

// Mock path module
jest.mock('path', () => ({
  default: {
    join: (...args: string[]) => args.join('/'),
  },
}));