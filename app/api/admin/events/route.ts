
// This endpoint is disabled because the Event model has been removed.
import { NextResponse } from 'next/server';

export async function GET() {
	return NextResponse.json([], { status: 200 });
}

// POST - สร้าง event ใหม่ (ปิดการใช้งานเพราะไม่มี event model แล้ว)
// export async function POST(request: NextRequest) {
//   return NextResponse.json({ error: 'Event model removed' }, { status: 400 });
// }
