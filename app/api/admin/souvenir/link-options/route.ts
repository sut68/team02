// This endpoint is disabled because the Event model has been removed.
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json([], { status: 200 });
}
