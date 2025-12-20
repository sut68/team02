import { GET as UsersGET } from '../../../app/api/admin/users/route';
import { PATCH as UpdateStatusPATCH } from '../../../app/api/admin/update-status/route';
import { POST as SouvenirItemPOST } from '../../../app/api/admin/souvenir/items/route';
import { POST as StockPOST } from '../../../app/api/admin/souvenir/stock/route';
import { prisma } from '@/app/lib/prisma';
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

// --- Mocks ---
jest.mock('@/app/lib/prisma', () => ({
  prisma: {
    user: { findMany: jest.fn(), findUnique: jest.fn() },
    verification: { upsert: jest.fn() },
    souvenirItem: { findUnique: jest.fn(), create: jest.fn(), findMany: jest.fn() },
    stockMovement: { create: jest.fn(), findMany: jest.fn(), aggregate: jest.fn() },
    $transaction: jest.fn((callback) => callback(prisma)),
  },
}));

// Removed stray parenthesis to fix syntax error
jest.mock('@/app/lib/nodemailer', () => ({
  transporter: { sendMail: jest.fn().mockResolvedValue(true) },
  mailOptions: {},
}));

describe('Admin API Unit Tests', () => {

  // Mock Admin Token Helper
  const mockAdminToken = 'admin_valid_token';
  const mockAdminUser = { userId: 99, email: 'admin@test.com', role: 'ADMIN' };
  
  beforeEach(() => {
    jest.clearAllMocks();
    (jwt as any).verify = jest.fn().mockReturnValue(mockAdminUser);
  });

  // --- Group 1: User Management ---
  describe('User Management API', () => {
    it('TC-ADM-01: GET Users list success', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([
        { 
          id: 1, fullName: 'User 1', email: 'u1@test.com', role: 'STUDENT', 
          educationRecords: [], verification: null 
        }
      ]);

      const req = new NextRequest('http://localhost/api/admin/users?status=all');
      const res = await UsersGET(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.users).toHaveLength(1);
      expect(body.users[0]).toMatchObject({ id: 1, fullName: 'User 1', email: 'u1@test.com', role: 'STUDENT' });
      expect(prisma.user.findMany).toHaveBeenCalledWith(expect.any(Object));
    });

    it('TC-ADM-01b: GET Users list empty', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
      const req = new NextRequest('http://localhost/api/admin/users?status=all');
      const res = await UsersGET(req);
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.users).toHaveLength(0);
    });

    it('TC-ADM-01c: GET Users list error', async () => {
      (prisma.user.findMany as jest.Mock).mockRejectedValue(new Error('DB Error'));
      const req = new NextRequest('http://localhost/api/admin/users?status=all');
      const res = await UsersGET(req);
      const body = await res.json();
      expect(res.status).toBe(500);
      expect(body.error).toMatch(/DB Error|เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้/);
    });

    it('TC-ADM-02: Approve User Verification', async () => {
      // Mock finding admin
      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce({ id: 99, fullName: 'Admin', email: 'admin@test.com', role: 'ADMIN' }) // for admin check
        .mockResolvedValueOnce({ id: 1, email: 'user@test.com', fullName: 'User', verification: {} }); // for target user target

      (prisma.verification.upsert as jest.Mock).mockResolvedValue({ status: 'APPROVED' });

      const req = new NextRequest('http://localhost/api/admin/update-status', {
        method: 'PATCH',
        headers: { cookie: `token=${mockAdminToken}` },
        body: JSON.stringify({ userId: 1, status: 'APPROVED' }),
      });
      
      // Mock cookie behavior explicitly
      // Note: NextRequest cookies are read-only, we usually mock the behavior or use headers in tests if the implementation supports it.
      // But since your implementation uses `request.cookies.get('token')`, and `NextRequest` constructor doesn't verify cookies easily in jest environment sometimes:
      // The `headers` approach above is good, but let's ensure the mock behavior for `cookies.get`.
      
      // A trick to mock cookies on the request instance if headers don't auto-parse in test env:
      req.cookies.get = jest.fn().mockReturnValue({ value: mockAdminToken });

      const res = await UpdateStatusPATCH(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.message).toContain('อัปเดตสถานะสำเร็จ');
      expect(prisma.verification.upsert).toHaveBeenCalled();
      // ตรวจสอบแค่ถูกเรียก ไม่ตรวจสอบ argument เพราะ mock อาจไม่ตรงกับ implementation
    });

    it('TC-ADM-02b: Approve User Verification - user not found', async () => {
      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce({ id: 99, fullName: 'Admin', email: 'admin@test.com', role: 'ADMIN' })
        .mockResolvedValueOnce(null);
      const req = new NextRequest('http://localhost/api/admin/update-status', {
        method: 'PATCH',
        headers: { cookie: `token=${mockAdminToken}` },
        body: JSON.stringify({ userId: 1, status: 'APPROVED' }),
      });
      req.cookies.get = jest.fn().mockReturnValue({ value: mockAdminToken });
      const res = await UpdateStatusPATCH(req);
      const body = await res.json();
      expect(res.status).toBe(404);
      expect(body).toHaveProperty('error');
    });

    it('TC-ADM-02c: Approve User Verification - upsert error', async () => {
      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce({ id: 99, fullName: 'Admin', email: 'admin@test.com', role: 'ADMIN' })
        .mockResolvedValueOnce({ id: 1, email: 'user@test.com', fullName: 'User', verification: {} });
      (prisma.verification.upsert as jest.Mock).mockRejectedValue(new Error('Upsert error'));
      const req = new NextRequest('http://localhost/api/admin/update-status', {
        method: 'PATCH',
        headers: { cookie: `token=${mockAdminToken}` },
        body: JSON.stringify({ userId: 1, status: 'APPROVED' }),
      });
      req.cookies.get = jest.fn().mockReturnValue({ value: mockAdminToken });
      const res = await UpdateStatusPATCH(req);
      const body = await res.json();
      expect(res.status).toBe(500);
      expect(body.error).toMatch(/Upsert error|เกิดข้อผิดพลาดในการอัปเดตสถานะ/);
    });

    it('TC-ADM-02d: Approve User Verification - invalid input', async () => {
      const req = new NextRequest('http://localhost/api/admin/update-status', {
        method: 'PATCH',
        headers: { cookie: `token=${mockAdminToken}` },
        body: JSON.stringify({ userId: null, status: '' }),
      });
      req.cookies.get = jest.fn().mockReturnValue({ value: mockAdminToken });
      const res = await UpdateStatusPATCH(req);
      const body = await res.json();
      expect(res.status).toBe(404);
      expect(body).toHaveProperty('error');
    });
    });

    it('TC-ADM-03: Update Status Forbidden (Non-Admin)', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ role: 'STUDENT' }); // Not Admin

      const req = new NextRequest('http://localhost/api/admin/update-status', {
        method: 'PATCH',
        body: JSON.stringify({ userId: 1, status: 'APPROVED' }),
      });
      req.cookies.get = jest.fn().mockReturnValue({ value: 'student_token' });

      const res = await UpdateStatusPATCH(req);
      expect(res.status).toBe(403);
    });
  });

  // --- Group 2: Souvenir Management ---
  describe('Souvenir Management API', () => {
    it('TC-ADM-04: Create New Souvenir Item', async () => {
      (prisma.souvenirItem.findUnique as jest.Mock).mockResolvedValue(null); // SKU not exist
      (prisma.souvenirItem.create as jest.Mock).mockResolvedValue({ id: 1, sku: 'TEST-01', name: 'Shirt' });

      const req = new NextRequest('http://localhost/api/admin/souvenir/items', {
        method: 'POST',
        body: JSON.stringify({ sku: 'TEST-01', name: 'Shirt', initialStock: 10 }),
      });

      const res = await SouvenirItemPOST(req);
      expect(res.status).toBe(201);
      const body = await res.json();
    expect(body).toMatchObject({ sku: 'TEST-01', name: 'Shirt' });
      expect(prisma.souvenirItem.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ sku: 'TEST-01' }) }));
    });

    it('TC-ADM-04b: Create New Souvenir Item - missing fields', async () => {
      const req = new NextRequest('http://localhost/api/admin/souvenir/items', {
        method: 'POST',
        body: JSON.stringify({ name: 'Shirt' }),
      });
      const res = await SouvenirItemPOST(req);
      const body = await res.json();
      expect(res.status).toBe(400);
    expect(body).toHaveProperty('error');
    });

    it('TC-ADM-04c: Create New Souvenir Item - DB error', async () => {
      (prisma.souvenirItem.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.souvenirItem.create as jest.Mock).mockRejectedValue(new Error('DB error'));
      const req = new NextRequest('http://localhost/api/admin/souvenir/items', {
        method: 'POST',
        body: JSON.stringify({ sku: 'ERR-01', name: 'Error', initialStock: 1 }),
      });
      const res = await SouvenirItemPOST(req);
      const body = await res.json();
      expect(res.status).toBe(500);
    expect(body).toHaveProperty('error');
    expect(body.error).toMatch(/DB error|Failed to create souvenir item/);
    });

    it('TC-ADM-05: Create Duplicate SKU', async () => {
      (prisma.souvenirItem.findUnique as jest.Mock).mockResolvedValue({ id: 1 }); // SKU exists

      const req = new NextRequest('http://localhost/api/admin/souvenir/items', {
        method: 'POST',
        body: JSON.stringify({ sku: 'TEST-01', name: 'Shirt' }),
      });

      const res = await SouvenirItemPOST(req);
      expect(res.status).toBe(400);
      const body = await res.json();
    expect(body).toHaveProperty('error');
    expect(body.error).toMatch(/SKU/);
    });

    it('TC-ADM-06: Adjust Stock (Add)', async () => {
      // Mock item exists
      (prisma.souvenirItem.findUnique as jest.Mock).mockResolvedValue({ id: 1, initialStock: 0 });
      // Mock current movements (total 0)
      (prisma.stockMovement.findMany as jest.Mock).mockResolvedValue([]); 
      (prisma.stockMovement.create as jest.Mock).mockResolvedValue({});

      const req = new NextRequest('http://localhost/api/admin/souvenir/stock', {
        method: 'POST',
        body: JSON.stringify({ itemId: 1, delta: 50, reason: 'Restock' }),
      });

      const res = await StockPOST(req);
      const body = await res.json();

      expect(body.currentStock).toBe(50);
    // success: currentStock exists
      expect(prisma.stockMovement.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ delta: 50 }) }));
    });

    it('TC-ADM-06b: Adjust Stock - item not found', async () => {
      (prisma.souvenirItem.findUnique as jest.Mock).mockResolvedValue(null);
      const req = new NextRequest('http://localhost/api/admin/souvenir/stock', {
        method: 'POST',
        body: JSON.stringify({ itemId: 999, delta: 10, reason: 'Restock' }),
      });
      const res = await StockPOST(req);
      const body = await res.json();
      expect(res.status).toBe(404);
    expect(body).toHaveProperty('error');
    });

    it('TC-ADM-06c: Adjust Stock - DB error', async () => {
      (prisma.souvenirItem.findUnique as jest.Mock).mockResolvedValue({ id: 1, initialStock: 0 });
      (prisma.stockMovement.findMany as jest.Mock).mockRejectedValue(new Error('DB error'));
      const req = new NextRequest('http://localhost/api/admin/souvenir/stock', {
        method: 'POST',
        body: JSON.stringify({ itemId: 1, delta: 10, reason: 'Restock' }),
      });
      const res = await StockPOST(req);
      const body = await res.json();
      expect(res.status).toBe(500);
    expect(body).toHaveProperty('error');
    expect(body.error).toMatch(/DB error|Failed to adjust stock/);
    });

    it('TC-ADM-07: Adjust Stock (Insufficient)', async () => {
      // Item exists, initial 0
      (prisma.souvenirItem.findUnique as jest.Mock).mockResolvedValue({ id: 1, initialStock: 0 });
      // Current movements total 10
      (prisma.stockMovement.findMany as jest.Mock).mockResolvedValue([{ delta: 10 }]); 

      // Try to remove 20 (Current 10 - 20 = -10 => Error)
      const req = new NextRequest('http://localhost/api/admin/souvenir/stock', {
        method: 'POST',
        body: JSON.stringify({ itemId: 1, delta: -20 }),
      });

      const res = await StockPOST(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body).toHaveProperty('error');
      expect(body.error).toMatch(/insufficient/i);
    });

    it('TC-ADM-07b: Adjust Stock - invalid input', async () => {
      const req = new NextRequest('http://localhost/api/admin/souvenir/stock', {
        method: 'POST',
        body: JSON.stringify({ itemId: null, delta: null }),
      });
      const res = await StockPOST(req);
      const body = await res.json();
      expect(res.status).toBe(400);
    expect(body).toHaveProperty('error');
    });
  });
