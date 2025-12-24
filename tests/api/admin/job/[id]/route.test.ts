import { GET, PATCH, DELETE } from '@/app/api/admin/job/[id]/route';
import { prisma } from '@/app/lib/prisma';
import { createMockRequest, createAuthToken } from '../../../../utils';

// ============================================================================
// 1. MOCKING DEPENDENCIES
// ============================================================================

jest.mock('@/app/lib/prisma', () => ({
  prisma: {
    jobPosting: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    approvalLog: {
      create: jest.fn(),
    },
  },
}));

// ============================================================================
// 2. TEST SUITE
// ============================================================================

describe('/api/admin/job/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // GET Tests
  // --------------------------------------------------------------------------
  describe('GET', () => {
    it('should return job detail for admin', async () => {
      const admin = { userId: 1, email: 'admin@example.com', role: 'ADMIN' };
      const token = createAuthToken(admin);

      const mockJob = {
        id: 1,
        title: 'Software Engineer',
        namejob: 'Senior Developer',
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { id: 1, fullName: 'Test User', email: 'test@example.com' },
        jobType: { id: 1, typename: 'FULL_TIME' },
        company: {
          id: 1,
          companyname: 'Test Company',
          companyaddress: 'Bangkok',
          CompanyLogoPath: null,
          CompanyPicturePath: null,
        },
      };

      (prisma.jobPosting.findUnique as jest.Mock).mockResolvedValue(mockJob);

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/admin/job/1',
        cookies: { token },
      });

      const params = Promise.resolve({ id: '1' });
      const response = await GET(request, { params } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.job).toBeDefined();
      expect(data.job.id).toBe(1);
    });

    it('should return 401 if user is not authenticated', async () => {
      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/admin/job/1',
        cookies: {},
      });

      const params = Promise.resolve({ id: '1' });
      const response = await GET(request, { params } as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 403 if user is not admin', async () => {
      const user = { userId: 1, email: 'user@example.com', role: 'USER' };
      const token = createAuthToken(user);

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/admin/job/1',
        cookies: { token },
      });

      const params = Promise.resolve({ id: '1' });
      const response = await GET(request, { params } as any);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden');
    });

    it('should return 404 if job not found', async () => {
      const admin = { userId: 1, email: 'admin@example.com', role: 'ADMIN' };
      const token = createAuthToken(admin);

      (prisma.jobPosting.findUnique as jest.Mock).mockResolvedValue(null);

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/admin/job/999',
        cookies: { token },
      });

      const params = Promise.resolve({ id: '999' });
      const response = await GET(request, { params } as any);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('ไม่พบข้อมูลงาน');
    });

    it('should return 400 for invalid job id', async () => {
      const admin = { userId: 1, email: 'admin@example.com', role: 'ADMIN' };
      const token = createAuthToken(admin);

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/admin/job/invalid',
        cookies: { token },
      });

      const params = Promise.resolve({ id: 'invalid' });
      const response = await GET(request, { params } as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Job ID ไม่ถูกต้อง');
    });
  });

  // --------------------------------------------------------------------------
  // PATCH Tests
  // --------------------------------------------------------------------------
  describe('PATCH', () => {
    it('should update job status to APPROVED', async () => {
      const admin = { userId: 1, email: 'admin@example.com', role: 'ADMIN' };
      const token = createAuthToken(admin);

      const mockUpdatedJob = {
        id: 1,
        title: 'Software Engineer',
        status: 'APPROVED',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { id: 1, fullName: 'Test User', email: 'test@example.com' },
        jobType: null,
        company: null,
      };

      (prisma.jobPosting.update as jest.Mock).mockResolvedValue(mockUpdatedJob);
      (prisma.approvalLog.create as jest.Mock).mockResolvedValue({
        id: 1,
        action: 'APPROVED',
        actionDate: new Date(),
        staffId: 1,
        jobId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = createMockRequest({
        method: 'PATCH',
        url: 'http://localhost:3000/api/admin/job/1',
        cookies: { token },
        body: { status: 'APPROVED' },
      });

      const params = Promise.resolve({ id: '1' });
      const response = await PATCH(request, { params } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('อัปเดตสถานะสำเร็จ');
      expect(data.job.status).toBe('APPROVED');
      expect(prisma.approvalLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'APPROVED',
            staffId: 1,
            jobId: 1,
          }),
        })
      );
    });

    it('should update job status to REJECTED', async () => {
      const admin = { userId: 1, email: 'admin@example.com', role: 'ADMIN' };
      const token = createAuthToken(admin);

      const mockUpdatedJob = {
        id: 1,
        title: 'Software Engineer',
        status: 'REJECTED',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { id: 1, fullName: 'Test User', email: 'test@example.com' },
        jobType: null,
        company: null,
      };

      (prisma.jobPosting.update as jest.Mock).mockResolvedValue(mockUpdatedJob);
      (prisma.approvalLog.create as jest.Mock).mockResolvedValue({
        id: 1,
        action: 'REJECTED',
        actionDate: new Date(),
        staffId: 1,
        jobId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = createMockRequest({
        method: 'PATCH',
        url: 'http://localhost:3000/api/admin/job/1',
        cookies: { token },
        body: { status: 'REJECTED' },
      });

      const params = Promise.resolve({ id: '1' });
      const response = await PATCH(request, { params } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.job.status).toBe('REJECTED');
    });

    it('should return 400 for invalid status', async () => {
      const admin = { userId: 1, email: 'admin@example.com', role: 'ADMIN' };
      const token = createAuthToken(admin);

      const request = createMockRequest({
        method: 'PATCH',
        url: 'http://localhost:3000/api/admin/job/1',
        cookies: { token },
        body: { status: 'INVALID_STATUS' },
      });

      const params = Promise.resolve({ id: '1' });
      const response = await PATCH(request, { params } as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('สถานะไม่ถูกต้อง');
    });

    it('should return 401 if user is not authenticated', async () => {
      const request = createMockRequest({
        method: 'PATCH',
        url: 'http://localhost:3000/api/admin/job/1',
        cookies: {},
        body: { status: 'APPROVED' },
      });

      const params = Promise.resolve({ id: '1' });
      const response = await PATCH(request, { params } as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 404 if job not found', async () => {
      const admin = { userId: 1, email: 'admin@example.com', role: 'ADMIN' };
      const token = createAuthToken(admin);

      const error: any = new Error('Record not found');
      error.code = 'P2025';

      (prisma.jobPosting.update as jest.Mock).mockRejectedValue(error);

      const request = createMockRequest({
        method: 'PATCH',
        url: 'http://localhost:3000/api/admin/job/999',
        cookies: { token },
        body: { status: 'APPROVED' },
      });

      const params = Promise.resolve({ id: '999' });
      const response = await PATCH(request, { params } as any);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('ไม่พบข้อมูลงาน');
    });
  });

  // --------------------------------------------------------------------------
  // DELETE Tests
  // --------------------------------------------------------------------------
  describe('DELETE', () => {
    it('should delete job successfully', async () => {
      const admin = { userId: 1, email: 'admin@example.com', role: 'ADMIN' };
      const token = createAuthToken(admin);

      (prisma.jobPosting.delete as jest.Mock).mockResolvedValue({
        id: 1,
        title: 'Software Engineer',
      });

      const request = createMockRequest({
        method: 'DELETE',
        url: 'http://localhost:3000/api/admin/job/1',
        cookies: { token },
      });

      const params = Promise.resolve({ id: '1' });
      const response = await DELETE(request, { params } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('ลบงานสำเร็จ');
      expect(prisma.jobPosting.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should return 401 if user is not authenticated', async () => {
      const request = createMockRequest({
        method: 'DELETE',
        url: 'http://localhost:3000/api/admin/job/1',
        cookies: {},
      });

      const params = Promise.resolve({ id: '1' });
      const response = await DELETE(request, { params } as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 403 if user is not admin', async () => {
      const user = { userId: 1, email: 'user@example.com', role: 'USER' };
      const token = createAuthToken(user);

      const request = createMockRequest({
        method: 'DELETE',
        url: 'http://localhost:3000/api/admin/job/1',
        cookies: { token },
      });

      const params = Promise.resolve({ id: '1' });
      const response = await DELETE(request, { params } as any);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden');
    });

    it('should return 404 if job not found', async () => {
      const admin = { userId: 1, email: 'admin@example.com', role: 'ADMIN' };
      const token = createAuthToken(admin);

      const error: any = new Error('Record not found');
      error.code = 'P2025';

      (prisma.jobPosting.delete as jest.Mock).mockRejectedValue(error);

      const request = createMockRequest({
        method: 'DELETE',
        url: 'http://localhost:3000/api/admin/job/999',
        cookies: { token },
      });

      const params = Promise.resolve({ id: '999' });
      const response = await DELETE(request, { params } as any);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('ไม่พบข้อมูลงาน');
    });

    it('should return 400 for invalid job id', async () => {
      const admin = { userId: 1, email: 'admin@example.com', role: 'ADMIN' };
      const token = createAuthToken(admin);

      const request = createMockRequest({
        method: 'DELETE',
        url: 'http://localhost:3000/api/admin/job/invalid',
        cookies: { token },
      });

      const params = Promise.resolve({ id: 'invalid' });
      const response = await DELETE(request, { params } as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Job ID ไม่ถูกต้อง');
    });
  });
});