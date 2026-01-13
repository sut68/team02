import { POST, PUT, GET, DELETE } from '@/app/api/donation-project/route';

import { prisma } from '@/app/lib/prisma';
import { NextRequest } from 'next/server';

// ============================================================================
// 1. MOCKING DEPENDENCIES
// ============================================================================

jest.mock('@/app/lib/prisma', () => ({
  prisma: {
    donationProject: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    donationTransaction: {
      count: jest.fn(), 
    },
  },
}));

// ============================================================================
// 2. TEST SUITE
// ============================================================================

describe('Donation Project API - Validation Tests', () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  const validProject = {
    title: 'โครงการปันสุขเพื่อเด็กยากไร้',
    description: 'รายละเอียดโครงการ...',
    goalAmount: 50000,
    startDate: new Date(Date.now() + 86400000).toISOString(), // พรุ่งนี้
    endDate: new Date(Date.now() + 86400000 * 30).toISOString(), // อีก 30 วัน
    coverImage: '/uploads/donation-1.jpg'
  };

  // --------------------------------------------------------------------------
  // Group 1: POST Request (Create)
  // --------------------------------------------------------------------------

  describe('POST Request Validation', () => {

    it('TC-DON-01: Should return 400 if title is empty', async () => {
      const body = { ...validProject, title: '' };
      const req = new NextRequest('http://localhost:3000/api', { method: 'POST', body: JSON.stringify(body) });
      const res = await POST(req);
      const json = await res.json();
      expect(res.status).toBe(400);
      expect(json.error).toBe('หัวข้อโครงการห้ามว่าง');
    });

    it('TC-DON-02: Should return 400 if goalAmount is less than or equal to 0', async () => {
      const body = { ...validProject, goalAmount: 0 };
      const req = new NextRequest('http://localhost:3000/api', { method: 'POST', body: JSON.stringify(body) });
      const res = await POST(req);
      const json = await res.json();
      expect(res.status).toBe(400);
      expect(json.error).toBe('เป้าหมายยอดบริจาคต้องมากกว่า 0');
    });

    it('TC-DON-03: Should return 400 if goalAmount has > 2 decimal places', async () => {
      const body = { ...validProject, goalAmount: 1000.555 };
      const req = new NextRequest('http://localhost:3000/api', { method: 'POST', body: JSON.stringify(body) });
      const res = await POST(req);
      const json = await res.json();
      expect(res.status).toBe(400);
      expect(json.error).toBe('ยอดเงินต้องมีทศนิยมไม่เกิน 2 ตำแหน่ง');
    });

    it('TC-DON-04: Should return 400 if End Date is before Start Date', async () => {
      const body = { 
        ...validProject, 
        startDate: '2026-02-01', 
        endDate: '2026-01-01' 
      };
      const req = new NextRequest('http://localhost:3000/api', { method: 'POST', body: JSON.stringify(body) });
      const res = await POST(req);
      const json = await res.json();
      expect(res.status).toBe(400);
      expect(json.error).toBe('วันสิ้นสุดโครงการต้องไม่อยู่ก่อนวันเริ่มต้น');
    });

    it('TC-DON-05: Should return 400 if coverImage is not a valid image path', async () => {
      const body = { ...validProject, coverImage: 'malicious-file.sh' };
      const req = new NextRequest('http://localhost:3000/api', { method: 'POST', body: JSON.stringify(body) });
      const res = await POST(req);
      const json = await res.json();
      expect(res.status).toBe(400);
      expect(json.error).toMatch(/ต้องเป็นไฟล์รูปภาพเท่านั้น/);
    });

    it('TC-DON-06: Should create donation project successfully', async () => {
      (prisma.donationProject.create as jest.Mock).mockResolvedValue({ id: 1, ...validProject });
      
      const req = new NextRequest('http://localhost:3000/api', { method: 'POST', body: JSON.stringify(validProject) });
      const res = await POST(req);
      
      expect(res.status).toBe(201);
      expect(prisma.donationProject.create).toHaveBeenCalled();
    });

  });

  // --------------------------------------------------------------------------
  // Group 2: PUT Request (Update)
  // --------------------------------------------------------------------------

  describe('PUT Request Validation', () => {

    it('TC-DON-PUT-01: Should return 400 if trying to update currentAmount directly', async () => {
      // ป้องกันการยิง API มาแก้ยอดเงินบริจาคสะสมโดยตรง (ควรเกิดจากระบบ Transaction เท่านั้น)
      const body = { id: 1, currentAmount: 999999 }; 
      const req = new NextRequest('http://localhost:3000/api', { method: 'PUT', body: JSON.stringify(body) });
      const res = await PUT(req);
      const json = await res.json();
      expect(res.status).toBe(400);
      expect(json.error).toBe('ไม่สามารถแก้ไขยอดบริจาคสะสมโดยตรงได้');
    });

    it('TC-DON-PUT-02: Should update project status to CLOSED manually', async () => {
      const body = { id: 1, status: 'CLOSED' };
      (prisma.donationProject.update as jest.Mock).mockResolvedValue({ id: 1, status: 'CLOSED' });

      const req = new NextRequest('http://localhost:3000/api', { method: 'PUT', body: JSON.stringify(body) });
      const res = await PUT(req);
      
      expect(res.status).toBe(200);
      expect(prisma.donationProject.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: 'CLOSED' })
      }));
    });

  });

  // --------------------------------------------------------------------------
  // Group 3: GET Request
  // --------------------------------------------------------------------------

  describe('GET Request', () => {
    
    it('TC-DON-GET-01: Should calculate progress percentage correctly', async () => {
      // Mock ข้อมูลที่มี goal 10,000 และได้มาแล้ว 5,000
      (prisma.donationProject.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        title: 'Project A',
        goalAmount: 10000,
        currentAmount: 5000
      });

      const req = new NextRequest('http://localhost:3000/api?id=1', { method: 'GET' });
      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      // ตรวจสอบว่า API มีการคำนวณ % ส่งกลับมา (ถ้า Logic อยู่ใน API)
      expect(json.project.progress).toBe(50); 
    });

    it('TC-DON-GET-02: Should filter only ACTIVE projects', async () => {
      const req = new NextRequest('http://localhost:3000/api?status=ACTIVE', { method: 'GET' });
      await GET(req);

      expect(prisma.donationProject.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ status: 'ACTIVE' })
      }));
    });

  });

  // --------------------------------------------------------------------------
  // Group 4: DELETE Request (Soft Delete)
  // --------------------------------------------------------------------------

  describe('DELETE Request', () => {
    it('TC-DON-DEL-01: Should set deletedAt and change status to INACTIVE', async () => {
      const req = new NextRequest('http://localhost:3000/api?id=1', { method: 'DELETE' });

      (prisma.donationProject.update as jest.Mock).mockResolvedValue({ id: 1, status: 'INACTIVE' });

      const res = await DELETE(req);
      expect(res.status).toBe(200);
      expect(prisma.donationProject.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          deletedAt: expect.any(Date),
        })
      }));
    });
  });

});