// lib/nodemailer.ts
import nodemailer from 'nodemailer';

const email = process.env.GMAIL_USER;
const pass = process.env.GMAIL_PASSWORD || process.env.GMAIL_PASS; // รองรับทั้ง GMAIL_PASSWORD และ GMAIL_PASS
const clientId = process.env.GMAIL_CLIENT_ID;
const clientSecret = process.env.GMAIL_CLIENT_SECRET;
const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
const fromName = process.env.GMAIL_FROM_NAME || 'ระบบศิษย์เก่าวิศวกรรมศาสตร์';

// ใช้ OAuth2 ถ้ามี credentials ครบ, ไม่งั้นใช้ App Password
const useOAuth2 = clientId && clientSecret && refreshToken;

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: useOAuth2
    ? {
        type: 'OAuth2',
        user: email,
        clientId: clientId,
        clientSecret: clientSecret,
        refreshToken: refreshToken,
      }
    : {
        user: email,
        pass: pass,
      },
});

export const mailOptions = {
  from: `${fromName} <${email}>`,
};