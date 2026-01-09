import { describe, it, expect } from '@jest/globals'; // หรือ import จาก library ที่คุณใช้
// ปรับ import ให้ตรงกับโครงสร้างโปรเจกต์จริง
const enable2fa = require('@/app/api/auth/enable-2fa/route').POST;
const verify2fa = require('@/app/api/auth/verify-2fa/route').POST;
const { setCache, getCache } = require('@/lib/redis');
const { addEmailJob, startEmailWorker } = require('@/lib/queue');
const speakeasy = require('speakeasy');

describe('ระบบความปลอดภัยและรองรับผู้ใช้จำนวนมาก', () => {

  describe('Next.js API Security & Scalability', () => {
    it('ควรเปิดใช้งาน 2FA และคืน secret', async () => {
      const mockRequest = { json: async () => ({ email: 'test2fa@example.com' }) };
      const res = await enable2fa(mockRequest as any);
      const body = await res.json();
      expect(body.secret).toBeDefined();
      expect(body.qrCode).toBeDefined();
      
      // ทดสอบ verify OTP
      const token = speakeasy.totp({ secret: body.secret, encoding: 'base32' });
      const verifyReq = { json: async () => ({ email: 'test2fa@example.com', token }) };
      const verifyRes = await verify2fa(verifyReq as any);
      const verifyBody = await verifyRes.json();
      expect(verifyBody.success).toBe(true);
    });

    it('ควรใช้งาน cache ได้', async () => {
      await setCache('testkey', 'testvalue', 10);
      const value = await getCache('testkey');
      expect(value).toBe('testvalue');
    });

    it('ควรใช้งาน queue ได้', async () => {
      const worker = startEmailWorker();
      await addEmailJob({ to: 'test@example.com', subject: 'Test', body: 'Hello' });
      
      let completed = false;
      // แก้ไข Type ของ job เป็น any หรือ Job type จาก library
      worker.on('completed', (job: any) => { 
        expect(job.name).toBe('sendEmail');
        completed = true;
      });

      await new Promise(resolve => setTimeout(resolve, 1000));
      await worker.close();
      expect(completed).toBe(true);
    });
  });

}); 