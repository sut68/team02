// app/api/project-proposal/route.test.ts
import { POST } from '@/app/api/project-proposal/route';
import { prisma } from '@/app/lib/prisma';
import { NextRequest } from 'next/server';

// 1. Mock Prisma และ Nodemailer
jest.mock('@/app/lib/prisma', () => ({
  prisma: {
    projectProposal: {
      create: jest.fn(),
      findFirst: jest.fn(), // จำเป็นสำหรับเช็คชื่อซ้ำ
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
    jest.clearAllMocks(); // ล้างค่า Mock ทุกครั้งหลังจบแต่ละ Test case
  });

  // ✅ 1. ตรวจสอบชื่อโครงการ (Basic Validation)

  it('TC-VAL-01: Should return 400 if project name is empty', async () => {
    const body = {
      project: { projectName: '', budgetRoundId: 1 },
      manager: { firstName: 'Test' }
    };
    const req = new NextRequest('http://localhost:3000/api', { method: 'POST', body: JSON.stringify(body) });
    
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe('ชื่อโครงการห้ามว่าง');
  });

  it('TC-VAL-02: Should return 400 if project name contains only whitespace', async () => {
    const body = {
      project: { projectName: '      ', budgetRoundId: 1 }, // ส่ง Space ยาวๆ
      manager: { firstName: 'Test' }
    };
    const req = new NextRequest('http://localhost:3000/api', { method: 'POST', body: JSON.stringify(body) });
    
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe('ชื่อโครงการห้ามว่าง'); // ควรได้ข้อความเดิมกับเคสว่างเปล่า
  });

  it('TC-VAL-03: Should return 400 if project name is too short (< 3 chars)', async () => {
    const body = {
      project: { projectName: 'AB', budgetRoundId: 1 },
      manager: { firstName: 'Test' }
    };
    const req = new NextRequest('http://localhost:3000/api', { method: 'POST', body: JSON.stringify(body) });
    
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toMatch(/สั้นเกินไป/);
  });

  it('TC-VAL-04: Should return 400 if project name is too long (> 200 chars)', async () => {
    const longName = 'a'.repeat(201); // สร้างชื่อยาว 201 ตัว
    const body = {
      project: { projectName: longName, budgetRoundId: 1 },
      manager: { firstName: 'Test' }
    };
    const req = new NextRequest('http://localhost:3000/api', { method: 'POST', body: JSON.stringify(body) });
    
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toMatch(/ยาวเกินไป/);
  });

  // ✅ 2. ตรวจสอบชื่อซ้ำ (Business Logic: Duplicate Check)
  it('TC-VAL-EXTRA-05: Should return 409 if project name exists in the SAME budget round', async () => {
    const duplicateName = 'Existing Project';
    const roundId = 1;

    const body = {
      project: { 
          projectName: duplicateName, 
          budgetRoundId: roundId,
          requestedAmount: 1000 
      },
      manager: { firstName: 'Test' }
    };

    // Mock: เจอข้อมูลเดิมใน DB (round เดียวกัน)
    (prisma.projectProposal.findFirst as jest.Mock).mockResolvedValue({ 
        id: 99, 
        projectName: duplicateName, 
        budgetRoundId: roundId 
    });

    const req = new NextRequest('http://localhost:3000/api', { method: 'POST', body: JSON.stringify(body) });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(409); // Conflict
    expect(json.error).toBe('ชื่อโครงการนี้มีอยู่ในรอบงบประมาณนี้แล้ว');
    
    // ตรวจสอบว่า Prisma หาข้อมูลโดยใช้เงื่อนไขที่ถูก
    expect(prisma.projectProposal.findFirst).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
            projectName: expect.objectContaining({ equals: duplicateName }),
            budgetRoundId: roundId
        })
    }));
  });

  it('TC-VAL-EXTRA-06: Should ALLOW same name in DIFFERENT budget round', async () => {
    const duplicateName = 'Existing Project';
    const roundId = 2; // คนละรอบกับที่มีในระบบ

    const body = {
      project: { 
          projectName: duplicateName, 
          budgetRoundId: roundId,
          requestedAmount: 1000 
      },
      manager: { firstName: 'Test' }
    };

    // Mock: ไม่เจอข้อมูล (เพราะค้นหาใน roundId: 2)
    (prisma.projectProposal.findFirst as jest.Mock).mockResolvedValue(null);
    
    // Mock: สร้างสำเร็จ
    (prisma.projectProposal.create as jest.Mock).mockResolvedValue({ id: 100, ...body.project });

    const req = new NextRequest('http://localhost:3000/api', { method: 'POST', body: JSON.stringify(body) });
    const res = await POST(req);

    expect(res.status).toBe(201); // Created
    expect(prisma.projectProposal.create).toHaveBeenCalled();
  });

  it('TC-VAL-07: Should trim whitespace from project name before saving', async () => {
    const body = {
        project: { projectName: '   Project A   ', budgetRoundId: 2, requestedAmount: 500 },
        manager: { firstName: 'Test' }
    };
    
    // Mock ให้หาไม่เจอ (ไม่ซ้ำ) และ Create สำเร็จ
    (prisma.projectProposal.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.projectProposal.create as jest.Mock).mockResolvedValue({ id: 1, projectName: 'Project A' }); // Mock ผลลัพธ์ที่ Trim แล้ว

    const req = new NextRequest('http://localhost:3000/api', { method: 'POST', body: JSON.stringify(body) });
    await POST(req);

    // ตรวจสอบว่า Prisma ถูกเรียกด้วยค่าที่ Trim แล้ว ('Project A') ไม่ใช่ค่าเดิมที่มี Space
    expect(prisma.projectProposal.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
        projectName: 'Project A' // ✅ ต้องตรงกับค่าที่คาดหวัง
        })
    }));
    });

 it('TC-VAL-08: Should return 400 if description is too long (> 500 chars)', async () => {
    const longDesc = 'a'.repeat(501); // สร้างคำบรรยายยาว 501 ตัว
    const body = {
      project: { 
          projectName: 'Normal Name', 
          description: longDesc,
          budgetRoundId: 1 
      },
      manager: { firstName: 'Test' }
    };
    const req = new NextRequest('http://localhost:3000/api', { method: 'POST', body: JSON.stringify(body) });
    
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toMatch(/รายละเอียดโครงการต้องไม่เกิน 500/);
  });

  // ✅ Test Case: ทดสอบส่ง 500 ตัวพอดีเป๊ะ
  it('TC-VAL-09: Should ALLOW description with exactly 500 chars', async () => {
    const boundaryDesc = 'a'.repeat(500); // 500 ตัวพอดีเป๊ะ
    const body = {
      project: { 
          projectName: 'Boundary Project', 
          description: boundaryDesc,
          budgetRoundId: 2 
      },
      manager: { firstName: 'Test' }
    };

    // Mock ให้ผ่าน
    (prisma.projectProposal.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.projectProposal.create as jest.Mock).mockResolvedValue({ id: 1, ...body.project });

    const req = new NextRequest('http://localhost:3000/api', { method: 'POST', body: JSON.stringify(body) });
    const res = await POST(req);

    expect(res.status).toBe(201); // ต้องผ่าน
  });

  // ✅ Test Case: ทดสอบว่าเป็น Optional (ไม่กรอกก็ต้องได้)
  it('TC-VAL-10: Should ALLOW creating project without description', async () => {
    const body = {
      project: { 
          projectName: 'No Desc Project', 
          budgetRoundId: 2 
      },
      manager: { firstName: 'Test' }
    };

    (prisma.projectProposal.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.projectProposal.create as jest.Mock).mockResolvedValue({ id: 1, ...body.project });

    const req = new NextRequest('http://localhost:3000/api', { method: 'POST', body: JSON.stringify(body) });
    const res = await POST(req);

    expect(res.status).toBe(201); // ต้องผ่าน
  });
});