import { GET } from '@/app/api/job/[id]/route';
import { prisma } from '@/app/lib/prisma';
import { createMockRequest } from '../../../utils';

// 1. Mock Prisma
jest.mock('@/app/lib/prisma', () => ({
  prisma: {
    jobPosting: {
      findUnique: jest.fn(),
    },
  },
}));

// 2. Test Suite
describe('/api/job/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return approved job by id', async () => {
      // Mock Data
      const mockJob = {
        id: 1,
        title: 'Software Engineer',
        namejob: 'Senior Developer',
        status: 'APPROVED',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { id: 1, fullName: 'Test User', email: 'test@example.com' },
        jobType: { id: 1, typename: 'FULL_TIME' },
        company: null,
      };

      (prisma.jobPosting.findUnique as jest.Mock).mockResolvedValue(mockJob);

      // Create Request
      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/job/1',
      });

      // Call API
      const params = Promise.resolve({ id: '1' });
      const response = await GET(request, { params } as any);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data.job).toBeDefined();
      expect(data.job.id).toBe(1);
      expect(data.job.status).toBe('APPROVED');
    });

    it('should return 404 if job not found', async () => {
      (prisma.jobPosting.findUnique as jest.Mock).mockResolvedValue(null);

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/job/999',
      });

      const params = Promise.resolve({ id: '999' });
      const response = await GET(request, { params } as any);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('ไม่พบข้อมูลงาน');
    });

    it('should return 403 if job is not approved', async () => {
      const mockJob = {
        id: 1,
        title: 'Software Engineer',
        namejob: 'Senior Developer',
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { id: 1, fullName: 'Test User', email: 'test@example.com' },
        jobType: null,
        company: null,
      };

      (prisma.jobPosting.findUnique as jest.Mock).mockResolvedValue(mockJob);

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/job/1',
      });

      const params = Promise.resolve({ id: '1' });
      const response = await GET(request, { params } as any);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('งานนี้ยังไม่ได้รับการอนุมัติ');
    });

    it('should return 400 for invalid job id', async () => {
      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/job/invalid',
      });

      const params = Promise.resolve({ id: 'invalid' });
      const response = await GET(request, { params } as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Job ID ไม่ถูกต้อง');
    });

    it('should handle database errors', async () => {
      (prisma.jobPosting.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/job/1',
      });

      const params = Promise.resolve({ id: '1' });
      const response = await GET(request, { params } as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('เกิดข้อผิดพลาดในการดึงข้อมูลงาน');
    });
  });
});