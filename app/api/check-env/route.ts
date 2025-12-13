import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    GMAIL_USER: process.env.GMAIL_USER ? '✅ มี' : '❌ ไม่มี',
    GMAIL_USER_VALUE: process.env.GMAIL_USER,
    GMAIL_PASSWORD: process.env.GMAIL_PASSWORD ? '✅ มี' : '❌ ไม่มี',
    GMAIL_PASSWORD_LENGTH: process.env.GMAIL_PASSWORD?.length || 0,
    GMAIL_PASS: process.env.GMAIL_PASS ? '✅ มี' : '❌ ไม่มี',
    GMAIL_CLIENT_ID: process.env.GMAIL_CLIENT_ID ? '✅ มี' : '❌ ไม่มี',
    GMAIL_CLIENT_SECRET: process.env.GMAIL_CLIENT_SECRET ? '✅ มี' : '❌ ไม่มี',
    GMAIL_REFRESH_TOKEN: process.env.GMAIL_REFRESH_TOKEN ? '✅ มี' : '❌ ไม่มี',
  });
}
