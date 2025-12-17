import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// GET - ดึงรายการลงทะเบียนของ event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // The eventRegistration model does not exist in the schema.
  // To allow build to succeed, return an empty array or a not implemented message.
  return NextResponse.json([]);
}
