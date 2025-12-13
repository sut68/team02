import { NextRequest, NextResponse } from 'next/server';

// Mock registrations API for content/[id]/registrations
export async function GET(request: NextRequest, context: { params: { id: string } } | Promise<{ params: { id: string } }>) {
  // รองรับทั้งกรณี params เป็น Promise และ sync
  const { params } = await Promise.resolve(context);
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Missing content id' }, { status: 400 });
  }
  // ตัวอย่างข้อมูล registration (สามารถเชื่อมต่อฐานข้อมูลจริงได้ถ้าต้องการ)
  const registrations = [
    { id: 1, user: { name: 'สมชาย', email: 'a@example.com' }, status: 'registered' },
    { id: 2, user: { name: 'สมหญิง', email: 'b@example.com' }, status: 'claimed' },
  ];
  return NextResponse.json(registrations);
}
