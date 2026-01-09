import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { verify2FAToken } from '@/lib/twofa';

export async function POST(request: NextRequest) {
  const { email, token } = await request.json();
  if (!email || !token) {
    return NextResponse.json({ error: 'กรุณาระบุอีเมลและรหัส OTP' }, { status: 400 });
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
    return NextResponse.json({ error: 'บัญชีนี้ยังไม่ได้เปิดใช้งาน 2FA' }, { status: 400 });
  }
  const isValid = verify2FAToken(user.twoFactorSecret, token);
  if (!isValid) {
    return NextResponse.json({ error: 'รหัส OTP ไม่ถูกต้อง' }, { status: 401 });
  }
  return NextResponse.json({ success: true });
}
