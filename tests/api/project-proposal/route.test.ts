import { POST, PUT, GET, DELETE } from '@/app/api/project-proposal/route';
import { prisma } from '@/app/lib/prisma';
import { NextRequest } from 'next/server';

// ============================================================================
// 1. MOCKING DEPENDENCIES
// ============================================================================

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

// ============================================================================
// 2. TEST SUITE
// ============================================================================

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

  // --------------------------------------------------------------------------
  // Group 1: POST Request (Create & Validation)
  // --------------------------------------------------------------------------

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
      manager: validManager
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
        manager: validManager
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
      manager: validManager
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
      manager: validManager
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
      manager: validManager
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
        manager: validManager
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
        manager: validManager
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

  // --------------------------------------------------------------------------
  // Group 2: PUT Request Validation
  // --------------------------------------------------------------------------
  describe('PUT Request Validation', () => {
    
    // ✅ Test Case: แก้ไขข้อมูลสำเร็จ (Happy Path)
    it('TC-PUT-01: Should update project details successfully', async () => {
      const body = {
        id: 1,
        projectName: 'Updated Project Name',
        description: 'Updated Description',
        manager: { id: 1, firstName: 'UpdatedManager' } // ส่ง ID เพื่อบอกว่าอัปเดตคนเดิม
      };

      // Mock Update
      (prisma.projectProposal.update as jest.Mock).mockResolvedValue({
        id: 1,
        projectName: 'Updated Project Name',
        description: 'Updated Description'
      });

      const req = new NextRequest('http://localhost:3000/api', { method: 'PUT', body: JSON.stringify(body) });
      const res = await PUT(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.message).toBe('แก้ไขสำเร็จ');
      expect(json.proposal.projectName).toBe('Updated Project Name');
    });

    // ❌ Validation Failures (เหมือน POST)

    it('TC-PUT-VAL-02: Should Trim whitespace when updating project name', async () => {
      const body = { id: 1, projectName: '   Updated Name   ' };
      
      // Mock result
      (prisma.projectProposal.update as jest.Mock).mockResolvedValue({ id: 1, projectName: 'Updated Name' });

      const req = new NextRequest('http://localhost:3000/api', { method: 'PUT', body: JSON.stringify(body) });
      await PUT(req);

      // เช็คว่า Prisma ถูกเรียกด้วยค่าที่ Trim แล้ว
      expect(prisma.projectProposal.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ projectName: 'Updated Name' })
      }));
    });

    it('TC-PUT-VAL-03: Should return 400 if UPDATING description too long (> 500 chars)', async () => {
      const longDesc = 'a'.repeat(501);
      const body = { id: 1, description: longDesc };
      const req = new NextRequest('http://localhost:3000/api', { method: 'PUT', body: JSON.stringify(body) });
      const res = await PUT(req);
      const json = await res.json();
      expect(res.status).toBe(400);
      expect(json.error).toMatch(/รายละเอียดโครงการต้องไม่เกิน 500/);
    });

    it('TC-PUT-VAL-04: Should return 400 if UPDATING requested amount to zero or negative', async () => {
      const body = { id: 1, requestedAmount: -100 };
      const req = new NextRequest('http://localhost:3000/api', { method: 'PUT', body: JSON.stringify(body) });
      const res = await PUT(req);
      const json = await res.json();
      expect(res.status).toBe(400);
      expect(json.error).toBe('งบประมาณที่ขอต้องมากกว่า 0');
    });

    it('TC-PUT-VAL-05: Should return 400 if UPDATING requested amount decimal > 2', async () => {
      const body = { id: 1, requestedAmount: 500.999 };
      const req = new NextRequest('http://localhost:3000/api', { method: 'PUT', body: JSON.stringify(body) });
      const res = await PUT(req);
      const json = await res.json();
      expect(res.status).toBe(400);
      expect(json.error).toBe('งบประมาณต้องมีทศนิยมไม่เกิน 2 ตำแหน่ง');
    });

    it('TC-PUT-DATE-06: Should return 400 if UPDATING End Date BEFORE Start Date', async () => {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() - 1); // จบก่อนเริ่ม
      const body = { 
          id: 1, 
          projectStartDate: startDate.toISOString(), 
          projectEndDate: endDate.toISOString() 
      };
      const req = new NextRequest('http://localhost:3000/api', { method: 'PUT', body: JSON.stringify(body) });
      const res = await PUT(req);
      const json = await res.json();
      expect(res.status).toBe(400);
      expect(json.error).toBe('วันสิ้นสุดโครงการต้องไม่อยู่ก่อนวันเริ่มต้น');
    });

    it('TC-PUT-FILE-07: Should return 400 when UPDATING with invalid file extension', async () => {
      const body = { id: 1, coverFilePath: '/uploads/virus.exe' };
      const req = new NextRequest('http://localhost:3000/api', { method: 'PUT', body: JSON.stringify(body) });
      const res = await PUT(req);
      const json = await res.json();
      expect(res.status).toBe(400);
      expect(json.error).toMatch(/ต้องเป็นไฟล์รูปภาพเท่านั้น/);
    });

    // ❌ Manager Validation in PUT

    it('TC-PUT-MGR-08: Should return 400 if updating manager with empty name', async () => {
      const body = { 
          id: 1, 
          manager: { id: 1, firstName: '' } // ❌ ส่งชื่อว่าง
      };
      const req = new NextRequest('http://localhost:3000/api', { method: 'PUT', body: JSON.stringify(body) });
      const res = await PUT(req);
      const json = await res.json();
      expect(res.status).toBe(400);
      expect(json.error).toBe('ชื่อผู้รับผิดชอบโครงการห้ามว่าง');
    });

    it('TC-PUT-MGR-09: Should return 400 if updating manager with invalid phone (9 digits)', async () => {
      const body = { 
          id: 1, 
          manager: { id: 1, phoneNumber: '081234567' } // ❌ 9 หลัก
      };
      const req = new NextRequest('http://localhost:3000/api', { method: 'PUT', body: JSON.stringify(body) });
      const res = await PUT(req);
      const json = await res.json();
      expect(res.status).toBe(400);
      expect(json.error).toBe('เบอร์โทรศัพท์มือถือต้องมี 10 หลัก');
    });

    // ✅ Logic Checks

    it('TC-PUT-LOGIC-10: Should trigger email sending when status changes to OPEN', async () => {
      const body = { id: 1, status: 'OPEN' };
      // Mock ให้คืนค่าที่มี budgetRoundId เพื่อไปหา Voter ได้
      (prisma.projectProposal.update as jest.Mock).mockResolvedValue({
        id: 1, status: 'OPEN', projectName: 'Open Project', budgetRoundId: 10
      });
      // Mock Voters
      (prisma.user.findMany as jest.Mock).mockResolvedValue([
        { email: 'voter@test.com', fullName: 'Voter' }
      ]);

      const req = new NextRequest('http://localhost:3000/api', { method: 'PUT', body: JSON.stringify(body) });
      const res = await PUT(req);
      expect(res.status).toBe(200);
      
      // เช็คว่าส่งเมลจริง
      const { transporter } = require('@/app/lib/nodemailer');
      expect(transporter.sendMail).toHaveBeenCalled();
    });
    
    it('TC-PUT-LOGIC-11: Should restore deleted project', async () => {
      const body = { id: 1, restore: true };
      (prisma.projectProposal.update as jest.Mock).mockResolvedValue({ id: 1, deletedAt: null });
      
      const req = new NextRequest('http://localhost:3000/api', { method: 'PUT', body: JSON.stringify(body) });
      const res = await PUT(req);
      const json = await res.json();
      
      expect(res.status).toBe(200);
      expect(json.message).toBe('กู้คืนสำเร็จ');
    });
  });

  // --------------------------------------------------------------------------
  // Group 3: GET Request
  // --------------------------------------------------------------------------
  describe('GET Request', () => {
    it('TC-GET-01: Should fetch project by ID', async () => {
      const req = new NextRequest('http://localhost:3000/api?id=1', { method: 'GET' });

      (prisma.projectProposal.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        projectName: 'Test Project',
        manager: { firstName: 'Manager' }
      });

      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.proposal.id).toBe(1);
    });

    it('TC-GET-02: Should return 404 if project not found', async () => {
      const req = new NextRequest('http://localhost:3000/api?id=999', { method: 'GET' });
      (prisma.projectProposal.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await GET(req);
      expect(res.status).toBe(404);
    });

    it('TC-GET-03: Should fetch all projects (with filters)', async () => {
      const req = new NextRequest('http://localhost:3000/api?status=PENDING', { method: 'GET' });

      (prisma.projectProposal.findMany as jest.Mock).mockResolvedValue([
        { id: 1, status: 'PENDING' },
        { id: 2, status: 'PENDING' }
      ]);

      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.proposals).toHaveLength(2);
      
      // เช็คว่ามีการส่ง filter ไป query จริง
      expect(prisma.projectProposal.findMany).toHaveBeenCalledWith(expect.objectContaining({
          where: expect.objectContaining({ status: 'PENDING' })
      }));
    });
  });

  // --------------------------------------------------------------------------
  // Group 4: DELETE Request (ลบข้อมูล)
  // --------------------------------------------------------------------------

  describe('DELETE Request', () => {
    it('TC-DEL-01: Should soft delete project (update deletedAt)', async () => {
      const req = new NextRequest('http://localhost:3000/api?id=1', { method: 'DELETE' });

      (prisma.projectProposal.update as jest.Mock).mockResolvedValue({
        id: 1,
        deletedAt: new Date()
      });

      const res = await DELETE(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.message).toBe('ลบสำเร็จ');
      
      // ✅ หัวใจสำคัญ: เช็คว่ามันคือการ Update deletedAt (Soft Delete)
      expect(prisma.projectProposal.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 1 },
        data: expect.objectContaining({ deletedAt: expect.any(Date) })
      }));
    });

    it('TC-DEL-02: Should return 400 if ID is missing', async () => {
      const req = new NextRequest('http://localhost:3000/api', { method: 'DELETE' }); // ไม่ส่ง ID
      const res = await DELETE(req);
      expect(res.status).toBe(400);
    });
  });

  // --------------------------------------------------------------------------
  // Group 5: Server Error Handling (500)
  // --------------------------------------------------------------------------
  describe('Server Error Handling', () => {
    it('TC-ERR-01: Should return 500 if Database fails', async () => {
      // จำลองให้ Prisma พัง (Throw Error)
      (prisma.projectProposal.findMany as jest.Mock).mockRejectedValue(new Error('Database Connection Failed'));

      const req = new NextRequest('http://localhost:3000/api', { method: 'GET' });
      const res = await GET(req);
      const json = await res.json();

      // ตรวจสอบว่าระบบส่ง 500 กลับมาจริง
      expect(res.status).toBe(500);
      expect(json.error).toBeDefined(); 
    });
  });

});