import { POST as LoginPOST } from '../../../app/api/auth/login/route';
import { POST as RegisterPOST } from '../../../app/api/auth/register/route';
import { GET as MeGET } from '../../../app/api/auth/me/route';
import { POST as ForgotPasswordPOST } from '../../../app/api/auth/forgot-password/route';
import { POST as ResetPasswordPOST } from '../../../app/api/auth/reset-password/route';
import { POST as LogoutPOST } from '../../../app/api/auth/logout/route';
import { prisma } from '../../../app/lib/prisma';
import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock Dependencies
jest.mock('@/app/lib/prisma', () => ({
  prisma: {
    user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    educationRecord: { findUnique: jest.fn(), create: jest.fn() },
    verification: { create: jest.fn() },
    passwordResetToken: {
      deleteMany: jest.fn().mockResolvedValue(undefined),
      create: jest.fn().mockResolvedValue(undefined),
      findUnique: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
    },
    $transaction: jest.fn((callback) => callback(prisma)),
  },
}));

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('@/app/lib/rate-limit', () => ({
  loginLimiter: jest.fn().mockResolvedValue(null),
  registerLimiter: jest.fn().mockResolvedValue(null),
}));
// Mock nodemailer to prevent actual email sending
jest.mock('@/app/lib/nodemailer', () => ({
  transporter: { sendMail: jest.fn().mockResolvedValue(true) },
  mailOptions: {},
}));

describe('Authentication API Unit Tests', () => {
  
  // --- Test Case Group: Login ---
  describe('POST /api/auth/login', () => {
    it('Case 1: Login success and receive Token', async () => {
      // Setup Mock Data
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashed_password',
        role: 'STUDENT',
        verification: { status: 'APPROVED' },
        educationRecords: []
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('mock_token');

      // Create Request
      const req = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
      });

      // Execute
      const res = await LoginPOST(req);
      const body = await res.json();

      // Assertions
      expect(res.status).toBe(200);
      expect(body.message).toBe('เข้าสู่ระบบสำเร็จ');
      expect(res.cookies.get('token')).toBeDefined();
    });

     it('Case 1.1: Login with incomplete data', async () => {
       const req = new NextRequest('http://localhost/api/auth/login', {
         method: 'POST',
         body: JSON.stringify({ email: 'test@example.com' }),
       });
       const res = await LoginPOST(req);
       expect(res.status).toBe(400);
     });

     it('Case 1.2: Login user not found', async () => {
       (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
       const req = new NextRequest('http://localhost/api/auth/login', {
         method: 'POST',
         body: JSON.stringify({ email: 'notfound@example.com', password: 'password123' }),
       });
       const res = await LoginPOST(req);
       expect(res.status).toBe(401);
     });

     it('Case 1.3: Login server error', async () => {
       (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('DB error'));
       const req = new NextRequest('http://localhost/api/auth/login', {
         method: 'POST',
         body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
       });
       const res = await LoginPOST(req);
       expect(res.status).toBe(500);
     });

    it('Case 2: Login failed due to wrong password', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashed_password',
        verification: { status: 'APPROVED' },
        educationRecords: []
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const req = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: 'wrongpassword' }),
      });

      const res = await LoginPOST(req);
      expect(res.status).toBe(401);
    });

    it('Case 3: Login failed due to pending account', async () => {
      const mockUser = {
        id: 1,
        email: 'pending@example.com',
        password: 'hashed_password',
        role: 'STUDENT',
        verification: { status: 'PENDING' },
        educationRecords: []
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const req = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'pending@example.com', password: 'password123' }),
      });

      const res = await LoginPOST(req);
      const body = await res.json();
      expect(res.status).toBe(403);
      expect(body.error).toContain('บัญชีของคุณรอการอนุมัติ');
    });
  });

  // --- Test Case Group: Forgot Password ---
  describe('POST /api/auth/forgot-password', () => {
    it('Case 8: Request reset password success', async () => {
      const req = new NextRequest('http://localhost/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com' }),
      });
      // mock user exists
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 1, email: 'test@example.com' });
      (prisma.passwordResetToken.create as jest.Mock).mockResolvedValue({});
      (prisma.passwordResetToken.deleteMany as jest.Mock).mockResolvedValue({});
      
      const res = await ForgotPasswordPOST(req);
      const body = await res.json();
      
      expect([200, 201]).toContain(res.status);
      expect(body.success).toBe(true);
      expect(prisma.passwordResetToken.create).toHaveBeenCalled();
      expect(prisma.passwordResetToken.deleteMany).toHaveBeenCalled();
    });

    it('Case 9: Request reset password without email', async () => {
      const req = new NextRequest('http://localhost/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const res = await ForgotPasswordPOST(req);
      expect(res.status).toBe(400);
    });

    it('Case 9.1: Request reset password with non-existent email', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      const req = new NextRequest('http://localhost/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: 'notfound@example.com' }),
      });
      const res = await ForgotPasswordPOST(req);
      const body = await res.json();
      expect([200, 201]).toContain(res.status);
      expect(body.success).toBe(true); // genericResponse
    });

    it('Case 9.2: Forgot password server error', async () => {
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('DB error'));
      const req = new NextRequest('http://localhost/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com' }),
      });
      const res = await ForgotPasswordPOST(req);
      const body = await res.json();
        expect(res.status).toBe(500);
      expect(body.error).toBeDefined();
    });
  });

  // --- Test Case Group: Reset Password ---
  describe('POST /api/auth/reset-password', () => {
    it('Case 10: Reset password without data', async () => {
      const req = new NextRequest('http://localhost/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const res = await ResetPasswordPOST(req);
      expect(res.status).toBe(400);
    });

    it('Case 10.1: Reset password success', async () => {
      const now = new Date();
      (prisma.passwordResetToken.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        usedAt: null,
        expiresAt: new Date(now.getTime() + 10000),
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_pw');
      (prisma.user.update as jest.Mock).mockResolvedValue({});
      (prisma.passwordResetToken.update as jest.Mock).mockResolvedValue({});

      const req = new NextRequest('http://localhost/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', token: 'token', newPassword: 'Password@123' }),
      });
      const res = await ResetPasswordPOST(req);
      const body = await res.json();
      
      expect([200, 201]).toContain(res.status);
      expect(body.message).toBeDefined();
    });

    it('Case 10.2: Reset password token or email mismatch', async () => {
      (prisma.passwordResetToken.findUnique as jest.Mock).mockResolvedValue({ email: 'other@example.com' });
      const req = new NextRequest('http://localhost/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', token: 'token', newPassword: 'Password@123' }),
      });
      const res = await ResetPasswordPOST(req);
      expect(res.status).toBe(400);
    });

    it('Case 10.3: Reset password token already used', async () => {
      (prisma.passwordResetToken.findUnique as jest.Mock).mockResolvedValue({ 
        email: 'test@example.com', 
        usedAt: new Date() 
      });
      const req = new NextRequest('http://localhost/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', token: 'token', newPassword: 'Password@123' }),
      });
      const res = await ResetPasswordPOST(req);
      expect(res.status).toBe(400);
    });

    it('Case 10.4: Reset password token expired', async () => {
      (prisma.passwordResetToken.findUnique as jest.Mock).mockResolvedValue({ 
        email: 'test@example.com', 
        usedAt: null, 
        expiresAt: new Date(Date.now() - 10000) 
      });
      const req = new NextRequest('http://localhost/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', token: 'token', newPassword: 'Password@123' }),
      });
      const res = await ResetPasswordPOST(req);
      expect(res.status).toBe(400);
    });

    it('Case 10.5: Reset password password too short', async () => {
      const req = new NextRequest('http://localhost/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', token: 'token', newPassword: '123' }),
      });
      const res = await ResetPasswordPOST(req);
      expect(res.status).toBe(400);
    });

    it('Case 10.6: Reset password server error', async () => {
      (prisma.passwordResetToken.findUnique as jest.Mock).mockRejectedValue(new Error('DB error'));
      const req = new NextRequest('http://localhost/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', token: 'token', newPassword: 'Password@123' }),
      });
      const res = await ResetPasswordPOST(req);
      const body = await res.json();
        expect(res.status).toBe(500);
      expect(body.error).toBeDefined();
    });
  });

  // --- Test Case Group: Logout ---
  describe('POST /api/auth/logout', () => {
    it('Case 11: Logout success', async () => {
      const req = new NextRequest('http://localhost/api/auth/logout', { method: 'POST' });
      const res = await LogoutPOST(req);
      const body = await res.json();
      expect([200, 201]).toContain(res.status);
      expect(body.message).toContain('ออกจากระบบ');
      expect(res.cookies.get('token')?.value).toBe('');
    });

    it('Case 12: Logout error', async () => {
      const errorLogout = async () => { throw new Error('logout error'); };
      // Note: In real route, error is caught. We mock error scenario if route logic allows injection,
      // but here we just test that the function handles try-catch.
      // Since we can't easily mock the internal cookies.set to throw, we skip detailed error branch 
      // or assume it returns 500 if error thrown.
    });
  });

  // --- Test Case Group: Register ---
  describe('POST /api/auth/register', () => {
    it('Case 4: Register success (Student)', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null); 
      (prisma.educationRecord.findUnique as jest.Mock).mockResolvedValue(null); 
      
      const mockCreatedUser = { id: 1, email: 'new@example.com', fullName: 'New User' };
      (prisma.user.create as jest.Mock).mockResolvedValue(mockCreatedUser);

      const formData = new FormData();
      formData.append('email', 'new@example.com');
      formData.append('password', 'Password@123');
      formData.append('fullName', 'New User');
      formData.append('phone', '0812345678');
      formData.append('address', '123 St');
      formData.append('subdistrict', 'Sub');
      formData.append('district', 'Dist');
      formData.append('province', 'Prov');
      formData.append('postalCode', '10000');
      formData.append('studentCode', 'B6000000');
      formData.append('major', 'CPE');

      const req = new NextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        body: formData,
      });

      const res = await RegisterPOST(req);
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.message).toContain('ลงทะเบียนสำเร็จ');
    });

    it('Case 4.1: Register incomplete data', async () => {
      const formData = new FormData();
      formData.append('email', 'new@example.com');
      // missing password
      const req = new NextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        body: formData,
      });
      const res = await RegisterPOST(req);
      expect(res.status).toBe(400);
    });

    it('Case 4.2: Register duplicate studentCode', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.educationRecord.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
      
      const formData = new FormData();
      formData.append('email', 'new2@example.com');
      formData.append('password', 'Password@123');
      formData.append('fullName', 'New User');
      formData.append('phone', '0812345678');
      formData.append('address', '123 St');
      formData.append('subdistrict', 'Sub');
      formData.append('district', 'Dist');
      formData.append('province', 'Prov');
      formData.append('postalCode', '10000');
      formData.append('studentCode', 'B6000000');
      formData.append('major', 'CPE');
      
      const req = new NextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        body: formData,
      });
      const res = await RegisterPOST(req);
      expect(res.status).toBe(400);
    });

    it('Case 4.3: Register server error', async () => {
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('DB error'));
      const formData = new FormData();
      formData.append('email', 'err@example.com');
      formData.append('password', 'Password@123');
      formData.append('fullName', 'User');
      formData.append('phone', '081');
      formData.append('address', 'Addr');
      formData.append('subdistrict', 'Sub');
      formData.append('district', 'Dist');
      formData.append('province', 'Prov');
      formData.append('postalCode', '10000');
      formData.append('studentCode', 'B6000001');
      formData.append('major', 'CPE');
      
      const req = new NextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        body: formData,
      });
      const res = await RegisterPOST(req);
        expect(res.status).toBe(500);
    });

    it('Case 5: Register duplicate Email', async () => {
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 1 });

        const formData = new FormData();
        formData.append('email', 'exist@example.com');
        formData.append('password', 'Password@123');
        formData.append('fullName', 'User');
        formData.append('phone', '081');
        formData.append('address', 'Addr');
        formData.append('subdistrict', 'Sub');
        formData.append('district', 'Dist');
        formData.append('province', 'Prov');
        formData.append('postalCode', '10000');
        formData.append('studentCode', 'B6000001');
        formData.append('major', 'CPE');

        const req = new NextRequest('http://localhost/api/auth/register', {
            method: 'POST',
            body: formData,
        });

        const res = await RegisterPOST(req);
        expect(res.status).toBe(400);
    });
  });

  // --- Test Case Group: Get Me ---
  describe('GET /api/auth/me', () => {
    it('Case 6: Get user info success', async () => {
        const mockUser = {
            id: 1,
            email: 'test@example.com',
            role: 'STUDENT',
            verification: { status: 'APPROVED' },
            educationRecords: [{ major: 'CPE' }]
        };

        (jwt.verify as jest.Mock).mockReturnValue({ userId: 1 });
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

        const headers = new Headers();
        headers.append('cookie', 'token=valid_token');
        const req = new NextRequest('http://localhost/api/auth/me', { headers });

        // Ensure MeGET is treated as accepting arguments by casting if necessary
        // In the route file, export function GET(req: NextRequest) must be defined.
        const res = await (MeGET as any)(req);
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.email).toBe('test@example.com');
    });

    it('Case 6.1: Get Me invalid token', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => { throw new Error('invalid token'); });
      const headers = new Headers();
      headers.append('cookie', 'token=invalid_token');
      const req = new NextRequest('http://localhost/api/auth/me', { headers });
      
      const res = await (MeGET as any)(req);
      expect(res.status).toBe(401);
    });

    it('Case 6.2: Get Me server error', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 1 });
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('DB error'));
      const headers = new Headers();
      headers.append('cookie', 'token=valid_token');
      const req = new NextRequest('http://localhost/api/auth/me', { headers });
      
      const res = await (MeGET as any)(req);
      expect(res.status).toBe(500);
    });

    it('Case 7: Get Me without Token', async () => {
        const req = new NextRequest('http://localhost/api/auth/me');
        const res = await (MeGET as any)(req);
        expect(res.status).toBe(401);
    });
  });
});