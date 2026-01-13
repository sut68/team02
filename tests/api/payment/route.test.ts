// tests/api/payment/route.test.ts
import { POST, GET } from '@/app/api/payment/route';
import { prisma } from '@/app/lib/prisma';
import { NextRequest } from 'next/server';
import { PaymentStatusType, TransactionStatus } from '@prisma/client';

// -----------------------------------------------------------------------------
// MOCK PRISMA
// -----------------------------------------------------------------------------
jest.mock('@/app/lib/prisma', () => ({
  prisma: {
    $transaction: jest.fn(),
    paymentRecord: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    budgetDonation: {
      update: jest.fn(),
    },
    donationTransaction: {
      update: jest.fn(),
    },
    donationProject: {
      update: jest.fn(),
    },
    booking: {
      update: jest.fn(),
    },
  },
}));

// ============================================================================
// POST /api/payment
// ============================================================================
describe('POST /api/payment', () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  // -------------------- NEGATIVE CASE #1 --------------------
  it('should return 400 if missing paymentId or status', async () => {
    const req = new NextRequest('http://localhost/api/payment', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe('Missing paymentId or status');
  });

  // -------------------- POSITIVE CASE --------------------
  it('should confirm payment and increment donation project', async () => {
    const mockPayment = {
      id: 1,
      amount: 5000,
      paymentStatus: PaymentStatusType.PENDING,
      budgetDonation: {
        id: 10,
        projectId: 99,
      },
      transaction: null,
      bookingId: null,
    };

    (prisma.$transaction as jest.Mock).mockImplementation(async (cb) => {
      return cb({
        paymentRecord: {
          findUnique: jest.fn().mockResolvedValue(mockPayment),
          update: jest.fn().mockResolvedValue({
            ...mockPayment,
            paymentStatus: PaymentStatusType.CONFIRMED,
          }),
        },
        budgetDonation: {
          update: jest.fn(),
        },
        donationProject: {
          update: jest.fn(),
        },
      });
    });

    const req = new NextRequest('http://localhost/api/payment', {
      method: 'POST',
      body: JSON.stringify({
        paymentId: 1,
        status: PaymentStatusType.CONFIRMED,
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  // -------------------- NEGATIVE CASE #2 --------------------
  it('should mark donation transaction as FAILED when cancelled', async () => {
    const mockPayment = {
      id: 1,
      amount: 1000,
      paymentStatus: PaymentStatusType.PENDING,
      budgetDonation: null,
      transaction: {
        id: 20,
        projectId: 5,
      },
      bookingId: null,
    };

    (prisma.$transaction as jest.Mock).mockImplementation(async (cb) => {
      return cb({
        paymentRecord: {
          findUnique: jest.fn().mockResolvedValue(mockPayment),
          update: jest.fn(),
        },
        donationTransaction: {
          update: jest.fn(),
        },
      });
    });

    const req = new NextRequest('http://localhost/api/payment', {
      method: 'POST',
      body: JSON.stringify({
        paymentId: 1,
        status: PaymentStatusType.CANCELLED,
      }),
    });

    const res = await POST(req);

    expect(res.status).toBe(200);
  });

  // -------------------- NEGATIVE CASE #3 --------------------
  it('should return 500 if payment record not found', async () => {
    (prisma.$transaction as jest.Mock).mockImplementation(async (cb) => {
      return cb({
        paymentRecord: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
      });
    });

    const req = new NextRequest('http://localhost/api/payment', {
      method: 'POST',
      body: JSON.stringify({
        paymentId: 999,
        status: PaymentStatusType.CONFIRMED,
      }),
    });

    const res = await POST(req);

    expect(res.status).toBe(500);
  });

});

// ============================================================================
// GET /api/payment
// ============================================================================
describe('GET /api/payment', () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return payment by id', async () => {
    (prisma.paymentRecord.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      amount: 2000,
      createdAt: new Date(),
      updatedAt: new Date(),
      paymentSlipUrl: null,
    });

    const req = new NextRequest('http://localhost/api/payment?paymentId=1');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.amount).toBe(2000);
  });

  it('should return 404 if payment not found', async () => {
    (prisma.paymentRecord.findUnique as jest.Mock).mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/payment?paymentId=99');
    const res = await GET(req);

    expect(res.status).toBe(404);
  });

  it('should return all payments', async () => {
    (prisma.paymentRecord.findMany as jest.Mock).mockResolvedValue([
      {
        id: 1,
        amount: 1000,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const req = new NextRequest('http://localhost/api/payment');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.length).toBe(1);
  });

});
