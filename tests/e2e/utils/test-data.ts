/**
 * Test user credentials
 */
export const TEST_USERS = {
  admin: {
    email: 'admin@test.com',
    password: 'password123',
    role: 'ADMIN' as const,
  },
  user: {
    email: 'user@test.com',
    password: 'password123',
    role: 'STUDENT' as const,
  },
} as const;

/**
 * Test job data factory
 */
export function createTestJobData(
  overrides: Partial<{
    jobTitle: string;
    jobName: string;
    position: string;
    qualification: string;
    salaryDetail: string;
    numPositions: number;
    contactInfo: string;
    companyName: string;
    companyAddress: string;
  }> = {}
) {
  return {
    jobTitle: 'E2E Test Job - Software Engineer',
    jobName: 'Senior Backend Developer',
    position: 'Full-stack Development',
    qualification:
      'Bachelor degree in Computer Science\n3+ years experience in Node.js\nStrong problem-solving skills',
    salaryDetail: '50,000 - 70,000 THB/month + Benefits',
    numPositions: 2,
    contactInfo: 'Email: jobs@testcompany.com\nPhone: 02-123-4567',
    companyName: 'Test Company Inc.',
    companyAddress: '123 Test Street, Sukhumvit Road\nBangkok 10110, Thailand',
    ...overrides,
  };
}
