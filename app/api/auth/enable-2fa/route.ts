import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { generate2FASecret, generate2FAQrCode } from '@/lib/twofa';

export async function POST(request: NextRequest) {
  const { email } = await request.json();
  if (!email) {
    return NextResponse.json({ error: 'กรุณาระบุอีเมล' }, { status: 400 });
  }
  // สร้าง secret สำหรับ 2FA
  const secretObj = generate2FASecret(email);
  const qrCode = await generate2FAQrCode(secretObj.otpauth_url);
  // บันทึก secret ในฐานข้อมูล
  await prisma.user.update({
    where: { email },
    data: {
      twoFactorSecret: secretObj.base32,
      twoFactorEnabled: true,
    },
  });
  return NextResponse.json({ secret: secretObj.base32, qrCode });
}
