// lib/twofa.ts
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';

export function generate2FASecret(email: string) {
  const secret = speakeasy.generateSecret({ name: `SUT Alumni Connect (${email})` });
  return secret;
}

export async function generate2FAQrCode(secret: string) {
  return await qrcode.toDataURL(secret);
}

export function verify2FAToken(secret: string, token: string) {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 1,
  });
}
