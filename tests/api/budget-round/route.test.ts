import { GET, POST, PUT, DELETE } from '@/app/api/budget-round/route';
import { prisma } from '@/app/lib/prisma';
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

// 1. MOCKING DEPENDENCIES
jest.mock('@/app/lib/prisma', () => ({
  prisma: {
    budgetRound: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));

// 2. HELPER FUNCTIONS
const mockLogin = (role = 'ADMIN') => {
  (jwt.verify as jest.Mock).mockReturnValue({
    userId: 1,
    email: 'admin@test.com',
    role: role,
  });
};

const createRequest = (method: string, urlParams = '', body: any = null) => {
  const url = `http://localhost:3000/api/budget-round${urlParams}`;
  const req = new NextRequest(url, {
    method,
    body: body ? JSON.stringify(body) : undefined,
  });
  req.cookies.set('token', 'valid_token');
  return req;
};

// 3. TEST SUITE
describe('Budget Round API Tests', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Group 1: GET Request (Fetch Rounds & Stats)
  describe('GET Request', () => {
    
    it('TC-ROUND-GET-01: Should calculate status and stats correctly (Filter APPROVED/OPEN)', async () => {
      // Mock Data: จำลอง Round ที่มี Proposal สถานะต่างๆ
      const mockRounds = [
        {
          id: 1,
          roundName: 'Round 1',
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-12-31'),
          isPublished: true,
          totalBudget: 10000,
          proposals: [
            { requestedAmount: 2000, status: 'APPROVED' }, 
            { requestedAmount: 3000, status: 'OPEN' },     
            { requestedAmount: 9999, status: 'REJECTED' }  
          ],
          budgetDonations: [
            { amount: 500 } // Donation 1
          ]
        }
      ];

      (prisma.budgetRound.findMany as jest.Mock).mockResolvedValue(mockRounds);

      const req = createRequest('GET');
      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      const round = json.budgetRounds[0];

      // เช็คการคำนวณ Stats
      // Total Requested = 2000 + 3000 = 5000
      expect(round.stats.totalRequested).toBe(5000); 
      expect(round.stats.totalDonated).toBe(500);
      
      // remaining = (accumulatedCarryOver + totalDonated) - totalRequested
      // accumulatedCarryOver = 0 (รอบแรก)
      // remaining = (0 + 500) - 5000 = -4500
      expect(round.stats.remaining).toBe(-4500); 
    });

    it('TC-ROUND-GET-02: Should filter by Fiscal Year', async () => {
      (prisma.budgetRound.findMany as jest.Mock).mockResolvedValue([]);

      const req = createRequest('GET', '?fiscalYear=2568');
      await GET(req);

      expect(prisma.budgetRound.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          fiscalYear: '2568'
        })
      }));
    });

    it('TC-ROUND-GET-03: Should return status "PREPARING" if not published', async () => {
        const mockRounds = [{
            startDate: new Date(), endDate: new Date(), 
            isPublished: false, // ยังไม่ Publish
            proposals: [], budgetDonations: []
        }];
        (prisma.budgetRound.findMany as jest.Mock).mockResolvedValue(mockRounds);
  
        const req = createRequest('GET');
        const res = await GET(req);
        const json = await res.json();
  
        expect(json.budgetRounds[0].status).toBe('PREPARING');
    });
  });

  // Group 2: POST Request (Create Round)
  describe('POST Request', () => {

    it('TC-ROUND-POST-01: Should create round successfully (Admin)', async () => {
      mockLogin('ADMIN');

      const body = {
        roundName: 'New Round',
        fiscalYear: '2568',
        totalBudget: 50000,
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        isPublished: true
      };

      (prisma.budgetRound.create as jest.Mock).mockResolvedValue({ id: 1, ...body });

      const req = createRequest('POST', '', body);
      const res = await POST(req);
      
      expect(res.status).toBe(201);
      expect(prisma.budgetRound.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
            totalBudget: 50000,
            isPublished: true
        })
      }));
    });

    it('TC-ROUND-POST-02: Should return 403 if user is NOT Admin', async () => {
      mockLogin('STUDENT');
      const req = createRequest('POST', '', { roundName: 'Hacker Round' });
      const res = await POST(req);
      expect(res.status).toBe(403);
    });

    it('TC-ROUND-POST-03: Should return 400 if roundName is missing', async () => {
      mockLogin('ADMIN');
      const body = { fiscalYear: '2568' }; // ขาด roundName
      const req = createRequest('POST', '', body);
      const res = await POST(req);
      expect(res.status).toBe(400);
    });
    
  });

  // Group 4: DELETE Request
  describe('DELETE Request', () => {

    it('TC-ROUND-DEL-01: Should soft delete round', async () => {
      mockLogin('ADMIN');
      (prisma.budgetRound.update as jest.Mock).mockResolvedValue({});

      const req = createRequest('DELETE', '?id=1');
      const res = await DELETE(req);

      expect(res.status).toBe(200);
      expect(prisma.budgetRound.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 1 },
        data: { deletedAt: expect.any(Date) }
      }));
    });

    it('TC-ROUND-DEL-02: Should return 401 if user is NOT Admin', async () => {
        mockLogin('STUDENT');
        const req = createRequest('DELETE', '?id=1');
        const res = await DELETE(req);
        expect(res.status).toBe(401);
    });

    it('TC-ROUND-DEL-03: Should return 400 if ID is missing', async () => {
        mockLogin('ADMIN');
        const req = createRequest('DELETE', '');
        const res = await DELETE(req);
        expect(res.status).toBe(400);
    });
  });

  // Group 5: Server Error Handling (500)
  describe('Server Error Handling', () => {
    
    it('TC-ERR-01: Should return 500 if Database fails', async () => {
        // จำลองให้ Prisma พัง
        (prisma.budgetRound.findMany as jest.Mock).mockRejectedValue(new Error('DB Connection Failed!'));

        const req = createRequest('GET');
        const res = await GET(req); 
        
        expect(res.status).toBe(500);
    });
  });

});