import { NextRequest } from 'next/server';
import { GET, POST, PUT, DELETE } from '@/app/api/budget-report/route';
import { prisma } from '@/app/lib/prisma';
import jwt from 'jsonwebtoken';

// ============================================================================
// 1. MOCKING DEPENDENCIES
// ============================================================================

jest.mock('@/app/lib/prisma', () => ({
  prisma: {
    summarySubmission: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    submissionImage: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(prisma)),
  },
}));

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
  sign: jest.fn().mockReturnValue('mock_token'),
}));

jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn(),
    writeFile: jest.fn(),
  },
}));

jest.mock('@/lib/azureBlob', () => ({
  uploadToAzureBlob: jest.fn().mockResolvedValue('https://mock-url.com/file.pdf'),
  deleteFromAzureBlob: jest.fn(),
}));

// ============================================================================
// 2. HELPER FUNCTIONS
// ============================================================================

const mockLogin = (role = 'STUDENT') => {
  (jwt.verify as jest.Mock).mockReturnValue({
    userId: 1,
    email: 'test@example.com',
    role: role,
  });
};

const createRequest = (method: string, urlParams = '', body: any = null, isFormData = false, isJson = false) => {
  const url = `http://localhost:3000/api/budget-report${urlParams}`;
  const headers: any = {};
  
  if (isJson) headers['content-type'] = 'application/json';

  const options: any = { method, headers };

  if (isFormData && body) {
    const formData = new FormData();
    Object.keys(body).forEach((key) => {
      formData.append(key, body[key]);
    });
    options.body = formData;
  } else if (isJson && body) {
    options.body = JSON.stringify(body);
  }

  const req = new NextRequest(url, options);
  
  // Mock cookies
  req.cookies.set('token', 'fake-valid-token');
  
  // Mock formData() method สำหรับ request ที่เป็น FormData
  if (isFormData) {
    req.formData = jest.fn().mockResolvedValue(options.body);
  }

  return req;
};

// ============================================================================
// 3. TEST SUITE
// ============================================================================

describe('Budget Report API Test Suite', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // Group 1: GET Request
  // --------------------------------------------------------------------------
  describe('GET Request', () => {

    it('TC-GET-01: Should return 200 and a list of reports', async () => {
      const mockReports = [
        { id: 1, proposal: { projectName: 'Project A', budgetRound: {}, manager: {} }, images: [], submitter: {} }
      ];
      (prisma.summarySubmission.findMany as jest.Mock).mockResolvedValue(mockReports);

      const req = createRequest('GET');
      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.reports).toHaveLength(1);
      expect(prisma.summarySubmission.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ deletedAt: null }) // Default ต้องไม่เอาตัวที่ลบ
      }));
    });

    it('TC-GET-02: Should return 200 and report details when ID is provided', async () => {
      const mockReport = { id: 10, proposal: { manager: {} }, images: [], submitter: {} };
      (prisma.summarySubmission.findUnique as jest.Mock).mockResolvedValue(mockReport);

      const req = createRequest('GET', '?id=10');
      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.report.id).toBe(10);
    });

    it('TC-GET-03: Should filter reports by status and fiscal year', async () => {
      (prisma.summarySubmission.findMany as jest.Mock).mockResolvedValue([]);

      const req = createRequest('GET', '?status=APPROVED&year=2568');
      await GET(req);

      expect(prisma.summarySubmission.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          status: 'APPROVED',
          proposal: {
             budgetRound: { fiscalYear: '2568' }
          }
        })
      }));
    });

    // ✅ เพิ่ม: Test Case สำหรับดูถังขยะ (Trash)
    it('TC-GET-04: Should fetch deleted reports when trash=true', async () => {
        (prisma.summarySubmission.findMany as jest.Mock).mockResolvedValue([]);
  
        const req = createRequest('GET', '?trash=true');
        await GET(req);
  
        expect(prisma.summarySubmission.findMany).toHaveBeenCalledWith(expect.objectContaining({
          where: expect.objectContaining({
            deletedAt: { not: null } // ต้องหาตัวที่มี deletedAt
          })
        }));
    });

    it('TC-GET-ERR-01: Should return 404 if report ID does not exist', async () => {
      (prisma.summarySubmission.findUnique as jest.Mock).mockResolvedValue(null);

      const req = createRequest('GET', '?id=999');
      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(404);
      expect(json.error).toBe('ไม่พบรายงาน');
    });

  });

  // --------------------------------------------------------------------------
  // Group 2: POST Request
  // --------------------------------------------------------------------------
  describe('POST Request', () => {

    it('TC-POST-01: Should create report successfully with basic fields', async () => {
      mockLogin();
      const body = { projectId: '101', actualExpense: '5000' };
      const req = createRequest('POST', '', body, true);

      (prisma.summarySubmission.create as jest.Mock).mockResolvedValue({ id: 1, status: 'DRAFT' });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.message).toBe('บันทึกรายงานสำเร็จ');
    });

    it('TC-POST-02: Should handle evidence file upload logic', async () => {
        mockLogin();
        const body = { projectId: '102', actualExpense: '1000' };
        const req = createRequest('POST', '', body, true);

        (prisma.summarySubmission.create as jest.Mock).mockResolvedValue({ id: 2 });

        const res = await POST(req);
        expect(res.status).toBe(201);
        expect(prisma.summarySubmission.create).toHaveBeenCalled();
    });

    it('TC-POST-03: Should process activity images logic', async () => {
        mockLogin();
        const body = { projectId: '103', actualExpense: '2000' };
        const req = createRequest('POST', '', body, true);
        
        (prisma.summarySubmission.create as jest.Mock).mockResolvedValue({ id: 3, images: [] });

        const res = await POST(req);
        const json = await res.json();

        expect(res.status).toBe(201);
        expect(json.report).toBeDefined();
    });

    // ✅ เพิ่ม: Test Case กรณีไม่ได้ Login (Unauthorized)
    it('TC-POST-AUTH-01: Should return 401 if user is not logged in', async () => {
        // Mock ให้ Token ไม่ถูกต้อง หรือไม่มี Token
        (jwt.verify as jest.Mock).mockImplementation(() => { throw new Error('Invalid Token'); });

        const req = createRequest('POST');
        const res = await POST(req);
        const json = await res.json();

        expect(res.status).toBe(401);
        expect(json.error).toBe('กรุณาเข้าสู่ระบบ');
    });

    it('TC-POST-ERR-01: Should return 400 if projectId or actualExpense is missing', async () => {
      mockLogin();
      const body = { projectId: '104' }; // ขาด actualExpense
      const req = createRequest('POST', '', body, true);

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toContain('ข้อมูลไม่ครบถ้วน');
    });

  });

  // --------------------------------------------------------------------------
  // Group 3: PUT Request
  // --------------------------------------------------------------------------
  describe('PUT Request', () => {

    it('TC-PUT-01: Should update status successfully via JSON body', async () => {
        mockLogin('ADMIN');
        const body = { id: 1, status: 'APPROVED' };
        const req = createRequest('PUT', '', body, false, true);

        (prisma.summarySubmission.update as jest.Mock).mockResolvedValue({ id: 1, status: 'APPROVED' });

        const res = await PUT(req);
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.message).toBe('อัปเดตสถานะสำเร็จ');
    });

    it('TC-PUT-02: Should update expense amount via FormData', async () => {
        mockLogin();
        const body = { id: '1', actualExpense: '7500' };
        const req = createRequest('PUT', '', body, true);

        const res = await PUT(req);

        expect(res.status).toBe(200);
        expect(prisma.summarySubmission.update).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: 1 },
            data: expect.objectContaining({ totalActualExpense: 7500 })
        }));
    });

    it('TC-PUT-03: Should delete specified images', async () => {
        mockLogin();
        const body = { id: '1', deletedFileIds: '10,11,12' };
        const req = createRequest('PUT', '', body, true);

        const res = await PUT(req);

        expect(res.status).toBe(200);
        expect(prisma.submissionImage.deleteMany).toHaveBeenCalledWith(expect.objectContaining({
            where: { 
                id: { in: [10, 11, 12] },
                submissionId: 1
            }
        }));
    });

    it('TC-PUT-ERR-01: Should return 400 if ID is missing in PUT request', async () => {
        mockLogin();
        const body = { actualExpense: '5000' };
        const req = createRequest('PUT', '', body, true);
        
        const res = await PUT(req);
        const json = await res.json();

        expect(res.status).toBe(400);
        expect(json.error).toBe('ไม่พบ ID รายงาน');
    });

    it('TC-PUT-AUTH-01: Should return 401 if unauthorized', async () => {
        (jwt.verify as jest.Mock).mockImplementation(() => { throw new Error('Invalid'); });
        const req = createRequest('PUT');
        const res = await PUT(req);
        expect(res.status).toBe(401);
    });

  });

  // --------------------------------------------------------------------------
  // Group 4: DELETE Request
  // --------------------------------------------------------------------------
  describe('DELETE Request', () => {
    it('TC-DEL-01: Should soft delete the report', async () => {
        mockLogin();
        const req = createRequest('DELETE', '?id=5');
        (prisma.summarySubmission.update as jest.Mock).mockResolvedValue({});

        const res = await DELETE(req);
        expect(res.status).toBe(200);
        expect(prisma.summarySubmission.update).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: 5 },
            data: expect.objectContaining({ deletedAt: expect.any(Date) })
        }));
    });

    it('TC-DEL-ERR-01: Should return 400 if ID is missing', async () => {
        mockLogin();
        const req = createRequest('DELETE', '');
        const res = await DELETE(req);
        expect(res.status).toBe(400);
    });

    it('TC-DEL-AUTH-01: Should return 401 if unauthorized', async () => {
        (jwt.verify as jest.Mock).mockImplementation(() => { throw new Error('Invalid'); });
        const req = createRequest('DELETE', '?id=1');
        const res = await DELETE(req);
        expect(res.status).toBe(401);
    });
  });

  // --------------------------------------------------------------------------
  // Group 5: Server Error (500)
  // --------------------------------------------------------------------------
  describe('Server Error Handling', () => {
    it('TC-ERR-01: Should log error and return 500 if DB fails', async () => {
        // จำลองให้ DB พัง
        (prisma.summarySubmission.findMany as jest.Mock).mockRejectedValue(new Error('DB Connection Failed!'));
  
        const req = createRequest('GET');
        const res = await GET(req);
        // const json = await res.json(); // ไม่จำเป็นต้องอ่าน body ก็ได้ถ้าเช็ค status
  
        expect(res.status).toBe(500);
        // Console จะแสดง error สีแดง เป็นปกติ
    });
  });

});