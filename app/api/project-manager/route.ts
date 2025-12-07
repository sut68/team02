// app/api/project-managers/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma'; 

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json([]);
  }

  try {
    const managers = await prisma.projectManager.findMany({
      where: {
        OR: [
          { firstName: { contains: query } }, // ค้นหาจากชื่อจริง
          { lastName: { contains: query } },  // หรือนามสกุล
          { email: { contains: query } },     // ค้นหาจากเมลด้วยก็ได้
        ],
      },
      take: 5, // ดึงมาแค่ 5 คน
    });

    return NextResponse.json(managers);
  } catch (error) {
    console.error("Error searching managers:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}