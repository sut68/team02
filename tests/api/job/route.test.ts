import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/job/route';
import { prisma } from '@/app/lib/prisma';
import jwt from 'jsonwebtoken';

// ============================================================================
// 1. MOCKING DEPENDENCIES
// ============================================================================

// Mock Prisma Client
jest.mock('@/app/lib/prisma', () => ({
  prisma: {
    jobType: { upsert: jest.fn().mockResolvedValue({ id: 1 }) },
    jobPosting: {
      create: jest.fn().mockResolvedValue({ id: 100 }),
      findUnique: jest.fn().mockResolvedValue({ id: 100, title: 'Test Job' }),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
    company: { create: jest.fn() },
  },
}));

// Mock JWT
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
  sign: jest.fn().mockReturnValue('mock_token'),
}));

// Mock File System
jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn(),
    writeFile: jest.fn(),
  },
}));

// ============================================================================
// 2. HELPER FUNCTIONS
// ============================================================================

const mockLogin = () => {
  (jwt.verify as jest.Mock).mockReturnValue({
    userId: 1,
    email: 'test@example.com',
    role: 'USER',
  });
};

const createRequest = (method: string, body: any = null, isFormData = false) => {
  const url = 'http://localhost:3000/api/job';
  
  if (method === 'GET') {
    return new NextRequest(url, { method });
  }

  if (isFormData && body) {
    const formData = new FormData();
    Object.keys(body).forEach((key) => {
      formData.append(key, body[key]);
    });
    
    const req = new NextRequest(url, { method, body: formData });
    req.cookies.set('token', 'fake-valid-token');
    return req;
  }

  return new NextRequest(url, { method });
};

// ============================================================================
// 3. TEST SUITE
// ============================================================================

describe('Job Management API - Validation Tests', () => { // <--- Level 1
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // Group 1: POST
  // --------------------------------------------------------------------------
  describe('POST Request Validation (Create Job)', () => { // <--- Level 2

    it('TC-JOB-AUTH-01: Should return 401 if user is not logged in', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => { throw new Error('Invalid'); });
      
      const formData = new FormData();
      formData.append('jobTitle', 'Test Job');
      
      const req = new NextRequest('http://localhost:3000/api/job', { 
        method: 'POST', 
        body: formData 
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.error).toBe('Unauthorized');
    });
    
    it('TC-JOB-VAL-01: Should return 400 if "jobTitle" is missing', async () => {
      mockLogin();
      const body = { salary: '20000', position: 'Developer' };
      
      const req = createRequest('POST', body, true);
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toBe('กรุณาระบุชื่อหัวข้อของงาน');
    });

    it('TC-JOB-VAL-02: Should return 400 if "jobTitle" is empty string', async () => {
      mockLogin();
      const body = { jobTitle: '   ', salary: '20000' };
      
      const req = createRequest('POST', body, true);
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toBe('กรุณาระบุชื่อหัวข้อของงาน');
    });

    it('TC-JOB-SUCCESS-01: Should create job successfully when data is valid', async () => {
      mockLogin();
      const body = {
        jobTitle: 'Senior React Developer',
        title: 'Senior React Developer',
        position: 'Frontend',
        salary: '50000',
        jobType: 'Full-time',
        positions: '2',
        companyName: 'Tech Co., Ltd.'
      };
      
      const req = createRequest('POST', body, true);
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.message).toBe('บันทึกประกาศงานสำเร็จ!');
      expect(prisma.jobPosting.create).toHaveBeenCalled();
    });

  });

  // --------------------------------------------------------------------------
  // Group 2: GET
  // --------------------------------------------------------------------------
  describe('GET Request Validation (Fetch Jobs)', () => { // <--- Level 2

    it('TC-JOB-GET-01: Should return 200 and list of approved jobs', async () => {
      const mockJobs = [{ id: 1, title: 'Job A', status: 'APPROVED' }];
      (prisma.jobPosting.findMany as jest.Mock).mockResolvedValue(mockJobs);
      (prisma.jobPosting.count as jest.Mock).mockResolvedValue(1);

      const req = createRequest('GET');
      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.jobs).toHaveLength(1);
      expect(json.pagination).toBeDefined();
    });

    it('TC-JOB-GET-02: Should handle database errors gracefully', async () => {
      (prisma.jobPosting.findMany as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const req = createRequest('GET');
      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(500);
      expect(json.error).toBe('เกิดข้อผิดพลาดในการดึงข้อมูลงาน');
    });

  });
});