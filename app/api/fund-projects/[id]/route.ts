import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

// GET /api/fund-projects/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = parseInt(id);

    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: "Invalid project ID" },
        { status: 400 }
      );
    }

    // -----------------------------
    // ดึงข้อมูลโครงการ + รายการบริจาค
    // -----------------------------
    const project = await prisma.donationProject.findUnique({
      where: { id: projectId },
      include: {
        transactions: true,   // ไม่มี isPublic, ไม่มี user — จึง include ทั้งหมด
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "ไม่พบโครงการ" },
        { status: 404 }
      );
    }

    // -----------------------------
    // คำนวณข้อมูลเสริม
    // -----------------------------
    const projectWithStats = {
      ...project,
      progress:
        project.goalAmount > 0
          ? Math.min(
              (project.currentAmount / project.goalAmount) * 100,
              100
            )
          : 0,
      donorCount: project._count.transactions,
      daysLeft: Math.max(
        0,
        Math.ceil(
          (new Date(project.endDate).getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24)
        )
      ),
    };

    return NextResponse.json(
      { project: projectWithStats },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching donation project:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูล" },
      { status: 500 }
    );
  }
}

// ✅ UPDATE (PATCH)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const projectId = parseInt(id);

  if (isNaN(projectId)) {
    return NextResponse.json({ error: "Project ID ไม่ถูกต้อง" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const updateData: Record<string, any> = {};

    if (body.title) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.goalAmount !== undefined)
      updateData.goalAmount = parseFloat(body.goalAmount);
    if (body.startDate) updateData.startDate = new Date(body.startDate);
    if (body.endDate) updateData.endDate = new Date(body.endDate);
    if (body.ownerName) updateData.ownerName = body.ownerName;
    if (body.contact) updateData.contact = body.contact;
    if (body.posterUrl !== undefined) updateData.posterUrl = body.posterUrl;
    if (body.status) updateData.status = body.status;

    if (Object.keys(updateData).length === 0)
      return NextResponse.json({ error: "ไม่มีข้อมูลสำหรับการแก้ไข" }, { status: 400 });

    const updatedProject = await prisma.donationProject.update({
      where: { id: projectId },
      data: updateData,
    });

    return NextResponse.json(updatedProject, { status: 200 });
  } catch (error) {
    console.error("PATCH error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการแก้ไขโครงการ" },
      { status: 500 }
    );
  }
}

// -----------------------------------------------------
// ⭐ DELETE /api/fund-projects/[id]
// -----------------------------------------------------
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const projectId = parseInt(id);

  if (isNaN(projectId)) {
    return NextResponse.json({ error: "Project ID ไม่ถูกต้อง" }, { status: 400 });
  }

  try {
    await prisma.donationProject.delete({
      where: { id: projectId },
    });

    return NextResponse.json(
      { message: "ลบโครงการเรียบร้อยแล้ว" },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการลบโครงการ" },
      { status: 500 }
    );
  }
}