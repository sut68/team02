// tests/api/project-proposal/route.test.ts
import { POST, PUT } from '@/app/api/project-proposal/route';
import { prisma } from '@/app/lib/prisma';
import { NextRequest } from 'next/server';

// 1. Mock Prisma และ Nodemailer
jest.mock('@/app/lib/prisma', () => ({
  prisma: {
    projectProposal: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    projectManager: {
      findFirst: jest.fn(),
    },
    user: {
        findMany: jest.fn(),
    }
  },
}));

jest.mock('@/app/lib/nodemailer', () => ({
  transporter: { sendMail: jest.fn() },
  mailOptions: {},
}));

describe('Project Proposal API - Validation Tests', () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ตัวแปร Manager ที่ถูกต้อง สำหรับใช้ซ้ำ
  const validManager = {
      firstName: 'Test',
      lastName: 'Manager',
      email: 'test@manager.com',
      phoneNumber: '0812345678' // 10 หลัก
  };

  // ✅ 1. ตรวจสอบชื่อโครงการ (Basic Validation)

  it('TC-VAL-01: Should return 400 if project name is empty', async () => {
    const body = {
      project: { projectName: '', budgetRoundId: 1 },
      manager: validManager
    };
    const req = new NextRequest('http://localhost:3000/api', { method: 'POST', body: JSON.stringify(body) });
    const res = await POST(req);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toBe('ชื่อโครงการห้ามว่าง');
  });

  it('TC-VAL-02: Should return 400 if project name contains only whitespace', async () => {
    const body = {
      project: { projectName: '      ', budgetRoundId: 1 },
      manager: validManager
    };
    const req = new NextRequest('http://localhost:3000/api', { method: 'POST', body: JSON.stringify(body) });
    const res = await POST(req);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toBe('ชื่อโครงการห้ามว่าง');
  });

  it('TC-VAL-03: Should return 400 if project name is too short (< 3 chars)', async () => {
    const body = {
      project: { projectName: 'AB', budgetRoundId: 1 },
      manager: validManager
    };
    const req = new NextRequest('http://localhost:3000/api', { method: 'POST', body: JSON.stringify(body) });
    const res = await POST(req);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toMatch(/สั้นเกินไป/);
  });

  it('TC-VAL-04: Should return 400 if project name is too long (> 200 chars)', async () => {
    const longName = 'a'.repeat(201);
    const body = {
      project: { projectName: longName, budgetRoundId: 1 },
      manager: validManager
    };
    const req = new NextRequest('http://localhost:3000/api', { method: 'POST', body: JSON.stringify(body) });
    const res = await POST(req);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toMatch(/ยาวเกินไป/);
  });

  // ✅ 2. ตรวจสอบชื่อซ้ำ
  it('TC-VAL-EXTRA-05: Should return 409 if project name exists in the SAME budget round', async () => {
    const duplicateName = 'Existing Project';
    const roundId = 1;

    const body = {
      project: { projectName: duplicateName, budgetRoundId: roundId, requestedAmount: 1000 },
      manager: validManager
    };

    (prisma.projectProposal.findFirst as jest.Mock).mockResolvedValue({ 
        id: 99, projectName: duplicateName, budgetRoundId: roundId 
    });

    const req = new NextRequest('http://localhost:3000/api', { method: 'POST', body: JSON.stringify(body) });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.error).toBe('ชื่อโครงการนี้มีอยู่ในรอบงบประมาณนี้แล้ว');
  });

  it('TC-VAL-EXTRA-06: Should ALLOW same name in DIFFERENT budget round', async () => {
    const duplicateName = 'Existing Project';
    const roundId = 2;

    const body = {
      project: { projectName: duplicateName, budgetRoundId: roundId, requestedAmount: 1000 },
      manager: validManager // ✅ ใส่ข้อมูล Manager ครบถ้วน
    };

    (prisma.projectProposal.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.projectProposal.create as jest.Mock).mockResolvedValue({ id: 100, ...body.project });

    const req = new NextRequest('http://localhost:3000/api', { method: 'POST', body: JSON.stringify(body) });
    const res = await POST(req);

    expect(res.status).toBe(201); // Created
  });

  it('TC-VAL-07: Should trim whitespace from project name before saving', async () => {
    const body = {
        project: { projectName: '   Project A   ', budgetRoundId: 2, requestedAmount: 500 },
        manager: validManager // ✅ ใส่ข้อมูล Manager ครบถ้วน
    };
    
    (prisma.projectProposal.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.projectProposal.create as jest.Mock).mockResolvedValue({ id: 1, projectName: 'Project A' });

    const req = new NextRequest('http://localhost:3000/api', { method: 'POST', body: JSON.stringify(body) });
    await POST(req);

    expect(prisma.projectProposal.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
            projectName: 'Project A'
        })
    }));
  });

 it('TC-VAL-08: Should return 400 if description is too long (> 500 chars)', async () => {
    const longDesc = 'a'.repeat(501);
    const body = {
      project: { projectName: 'Normal Name', description: longDesc, budgetRoundId: 1 },
      manager: validManager
    };
    const req = new NextRequest('http://localhost:3000/api', { method: 'POST', body: JSON.stringify(body) });
    const res = await POST(req);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toMatch(/รายละเอียดโครงการต้องไม่เกิน 500/);
  });

  it('TC-VAL-09: Should ALLOW description with exactly 500 chars', async () => {
    const boundaryDesc = 'a'.repeat(500);
    const body = {
      project: { projectName: 'Boundary Project', description: boundaryDesc, budgetRoundId: 2 },
      manager: validManager // ✅ ใส่ข้อมูล Manager ครบถ้วน
    };
    (prisma.projectProposal.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.projectProposal.create as jest.Mock).mockResolvedValue({ id: 1, ...body.project });
    const req = new NextRequest('http://localhost:3000/api', { method: 'POST', body: JSON.stringify(body) });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('TC-VAL-10: Should ALLOW creating project without description', async () => {
    const body = {
      project: { projectName: 'No Desc Project', budgetRoundId: 2 },
      manager: validManager // ✅ ใส่ข้อมูล Manager ครบถ้วน
    };
    (prisma.projectProposal.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.projectProposal.create as jest.Mock).mockResolvedValue({ id: 1, ...body.project });
    const req = new NextRequest('http://localhost:3000/api', { method: 'POST', body: JSON.stringify(body) });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('TC-VAL-11: Should return 400 if requested amount is zero or negative', async () => {
    const body = {
      project: { projectName: 'Bad Budget Project', requestedAmount: -500, budgetRoundId: 2 },
      manager: validManager
    };
    const req = new NextRequest('http://localhost:3000/api', { method: 'POST', body: JSON.stringify(body) });
    const res = await POST(req);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toBe('งบประมาณที่ขอต้องมากกว่า 0');
  });

  it('TC-VAL-12: Should return 400 if decimal places > 2', async () => {
    const body = {
      project: { projectName: 'Decimal Project', requestedAmount: 100.123, budgetRoundId: 1 },
      manager: validManager
    };
    const req = new NextRequest('http://localhost:3000/api', { method: 'POST', body: JSON.stringify(body) });
    const res = await POST(req);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toBe('งบประมาณต้องมีทศนิยมไม่เกิน 2 ตำแหน่ง');
  });

  it('TC-VAL-13: Should create proposal successfully', async () => {
    const roundId = 1;
    const body = {
      project: { projectName: 'My Project', requestedAmount: 99999999, budgetRoundId: roundId },
      manager: validManager // ✅ ใส่ข้อมูล Manager ครบถ้วน
    };
    (prisma.projectProposal.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.projectProposal.create as jest.Mock).mockResolvedValue({ id: 1, ...body.project });
    const req = new NextRequest('http://localhost:3000/api', { method: 'POST', body: JSON.stringify(body) });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('TC-VAL-DATE-14: Should return 400 if Start Date is in the PAST', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const body = {
        project: { 
            projectName: 'Past Project', budgetRoundId: 1,
            projectStartDate: yesterday.toISOString(), projectEndDate: new Date().toISOString()
        },
        manager: validManager
      };
      const req = new NextRequest('http://localhost:3000/api', { method: 'POST', body: JSON.stringify(body) });
      const res = await POST(req);
      const json = await res.json();
      expect(res.status).toBe(400);
      expect(json.error).toMatch(/วันเริ่มต้นโครงการต้องไม่เป็นอดีต/);
    });

    it('TC-VAL-DATE-15: Should return 400 if End Date is BEFORE Start Date', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 2);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 1);

      const body = {
        project: { 
            projectName: 'Time Traveler', budgetRoundId: 1,
            projectStartDate: startDate.toISOString().split('T')[0],
            projectEndDate: endDate.toISOString().split('T')[0]
        },
        manager: validManager
      };
      const req = new NextRequest('http://localhost:3000/api', { method: 'POST', body: JSON.stringify(body) });
      const res = await POST(req);
      const json = await res.json();
      expect(res.status).toBe(400);
      expect(json.error).toBe('วันสิ้นสุดโครงการต้องไม่อยู่ก่อนวันเริ่มต้น');
    });

    it('TC-VAL-DATE-16: Should ALLOW if End Date is SAME as Start Date', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const dateStr = futureDate.toISOString().split('T')[0];

      const body = {
        project: { 
            projectName: 'One Day Project', budgetRoundId: 1,
            projectStartDate: dateStr, projectEndDate: dateStr 
        },
        manager: validManager // ✅ ใส่ข้อมูล Manager ครบถ้วน
      };
      (prisma.projectProposal.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.projectProposal.create as jest.Mock).mockResolvedValue({ id: 1, ...body.project });
      const req = new NextRequest('http://localhost:3000/api', { method: 'POST', body: JSON.stringify(body) });
      const res = await POST(req);
      expect(res.status).toBe(201);
    });

    it('TC-VAL-DATE-17: Should return 400 if Date Format is invalid', async () => {
      const body = {
        project: { projectName: 'Invalid Date', budgetRoundId: 1, projectStartDate: 'Not-A-Date', projectEndDate: '2024-01-01' },
        manager: validManager
      };
      const req = new NextRequest('http://localhost:3000/api', { method: 'POST', body: JSON.stringify(body) });
      const res = await POST(req);
      const json = await res.json();
      expect(res.status).toBe(400);
      expect(json.error).toBe('รูปแบบวันที่ไม่ถูกต้อง');
    });

    it('TC-VAL-IMG-18: Should return 400 if coverFilePath is NOT an image', async () => {
      const body = {
        project: { projectName: 'PDF Project', budgetRoundId: 1, coverFilePath: '/uploads/document.pdf' },
        manager: validManager
      };
      const req = new NextRequest('http://localhost:3000/api', { method: 'POST', body: JSON.stringify(body) });
      const res = await POST(req);
      const json = await res.json();
      expect(res.status).toBe(400);
      expect(json.error).toMatch(/ต้องเป็นไฟล์รูปภาพเท่านั้น/);
    });

    it('TC-VAL-IMG-19: Should ALLOW valid image extensions (.jpg, .png)', async () => {
      const body = {
        project: { projectName: 'Image Project', budgetRoundId: 1, coverFilePath: '/uploads/poster.png' },
        manager: validManager // ✅ ใส่ข้อมูล Manager ครบถ้วน
      };
      (prisma.projectProposal.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.projectProposal.create as jest.Mock).mockResolvedValue({ id: 1, ...body.project });
      const req = new NextRequest('http://localhost:3000/api', { method: 'POST', body: JSON.stringify(body) });
      const res = await POST(req);
      expect(res.status).toBe(201);
    });

  // ✅ 5. ตรวจสอบข้อมูลผู้รับผิดชอบโครงการ (Manager Validation)

  it('TC-MGR-VAL-20: Should return 400 if manager name is missing', async () => {
    const body = {
      project: { projectName: 'No Manager Name', budgetRoundId: 1 },
      manager: { 
          firstName: '', // ❌ ชื่อว่าง
          lastName: 'Doe',
          email: 'test@test.com'
      }
    };
    const req = new NextRequest('http://localhost:3000/api', { method: 'POST', body: JSON.stringify(body) });
    const res = await POST(req);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toBe('ชื่อและนามสกุลผู้รับผิดชอบโครงการห้ามว่าง');
  });

  it('TC-MGR-VAL-21: Should return 400 if manager email is invalid', async () => {
    const body = {
      project: { projectName: 'Bad Email Project', budgetRoundId: 1 },
      manager: { 
          firstName: 'John',
          lastName: 'Doe',
          email: 'not-an-email' // ❌ อีเมลผิด format
      }
    };
    const req = new NextRequest('http://localhost:3000/api', { method: 'POST', body: JSON.stringify(body) });
    const res = await POST(req);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toBe('รูปแบบอีเมลผู้รับผิดชอบโครงการไม่ถูกต้อง');
  });

  it('TC-MGR-VAL-22: Should return 400 if phone number is NOT 10 digits (Mobile)', async () => {
    const body = {
      project: { projectName: 'Bad Phone Project', budgetRoundId: 1 },
      manager: { 
          firstName: 'John',
          lastName: 'Doe',
          email: 'test@test.com',
          phoneNumber: '081234567' // ❌ มีแค่ 9 หลัก
      }
    };
    const req = new NextRequest('http://localhost:3000/api', { method: 'POST', body: JSON.stringify(body) });
    const res = await POST(req);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toMatch(/เบอร์โทรศัพท์มือถือต้องมี 10 หลัก/); 
  });

  it('TC-MGR-VAL-23: Should ALLOW valid 10-digit mobile number', async () => {
    const body = {
      project: { projectName: 'Good Phone Project', budgetRoundId: 1 },
      manager: { 
          firstName: 'John',
          lastName: 'Doe',
          email: 'test@test.com',
          phoneNumber: '0812345678' // ✅ ครบ 10 หลัก
      }
    };
    (prisma.projectProposal.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.projectManager.findFirst as jest.Mock).mockResolvedValue(null); 
    (prisma.projectProposal.create as jest.Mock).mockResolvedValue({ id: 1, ...body.project });

    const req = new NextRequest('http://localhost:3000/api', { method: 'POST', body: JSON.stringify(body) });
    const res = await POST(req);
    expect(res.status).toBe(201); // Created
  });

  // Test Case ของ PUT ยังคงเดิมได้ (แต่ถ้าจะเทส PUT เรื่อง Manager ก็ต้องเพิ่ม manager object ใน body ให้ครบเหมือนกันครับ)
});