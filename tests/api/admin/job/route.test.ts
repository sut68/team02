import { GET } from '@/app/api/admin/job/route';
import { prisma } from '@/app/lib/prisma';
import { createMockRequest, createAuthToken } from '../../../utils'; // ตรวจสอบ path ให้ตรงกับโครงสร้างจริง

// ============================================================================
// 1. MOCKING DEPENDENCIES
// ============================================================================

// Mock Prisma
jest.mock('@/app/lib/prisma', () => ({
  prisma: {
    jobPosting: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

// ============================================================================
// 2. TEST SUITE
// ============================================================================

describe('/api/admin/job', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return all jobs for admin', async () => {
      const admin = { userId: 1, email: 'admin@example.com', role: 'ADMIN' };
      const token = createAuthToken(admin);

      const mockJobs = [
        {
          id: 1,
          title: 'Software Engineer',
          status: 'PENDING',
          createdAt: new Date(),
          user: { id: 1, fullName: 'Test User', email: 'test@example.com' },
          jobType: null,
          company: null,
        },
        {
          id: 2,
          title: 'Designer',
          status: 'APPROVED',
          createdAt: new Date(),
          user: { id: 2, fullName: 'User 2', email: 'user2@example.com' },
          jobType: { id: 1, typename: 'FULL_TIME' },
          company: null,
        },
      ];

      // ใช้ Type Assertion (as jest.Mock) แทน vi.mocked
      (prisma.jobPosting.findMany as jest.Mock).mockResolvedValue(mockJobs);
      (prisma.jobPosting.count as jest.Mock)
        .mockResolvedValueOnce(2) // all
        .mockResolvedValueOnce(1) // pending
        .mockResolvedValueOnce(1) // approved
        .mockResolvedValueOnce(0); // rejected

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/admin/job?status=all',
        cookies: { token },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.jobs).toHaveLength(2);
      expect(data.stats).toEqual({
        all: 2,
        pending: 1,
        approved: 1,
        rejected: 0,
      });
    });

    it('should filter jobs by status', async () => {
      const admin = { userId: 1, email: 'admin@example.com', role: 'ADMIN' };
      const token = createAuthToken(admin);

      const mockJobs = [
        {
          id: 1,
          title: 'Software Engineer',
          status: 'PENDING',
          createdAt: new Date(),
          user: { id: 1, fullName: 'Test User', email: 'test@example.com' },
          jobType: null,
          company: null,
        },
      ];

      (prisma.jobPosting.findMany as jest.Mock).mockResolvedValue(mockJobs);
      (prisma.jobPosting.count as jest.Mock)
        .mockResolvedValueOnce(1) // all
        .mockResolvedValueOnce(1) // pending
        .mockResolvedValueOnce(0) // approved
        .mockResolvedValueOnce(0); // rejected

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/admin/job?status=pending',
        cookies: { token },
      });

      const response = await GET(request);
      const data = await response.json(); // ต้องอ่าน json แม้ไม่ได้ใช้ เพื่อให้ Promise จบสมบูรณ์

      expect(response.status).toBe(200);
      expect(prisma.jobPosting.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'PENDING' },
        })
      );
    });

    it('should return 401 if user is not authenticated', async () => {
      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/admin/job',
        cookies: {},
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 403 if user is not admin', async () => {
      const user = { userId: 1, email: 'user@example.com', role: 'USER' };
      const token = createAuthToken(user);

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/admin/job',
        cookies: { token },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden');
    });

    it('should handle errors gracefully', async () => {
      const admin = { userId: 1, email: 'admin@example.com', role: 'ADMIN' };
      const token = createAuthToken(admin);

      (prisma.jobPosting.findMany as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/admin/job',
        cookies: { token },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('เกิดข้อผิดพลาดในการดึงข้อมูลงาน');
    });
  });
});