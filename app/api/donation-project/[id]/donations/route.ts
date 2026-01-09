import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = parseInt(id);

    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: "Invalid Project ID" },
        { status: 400 }
      );
    }

    // 1. Fetch the project to see which SouvenirItem is linked to it
    const project = await prisma.donationProject.findUnique({
      where: { id: projectId },
      select: { souvenirItemId: true },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // 2. If the project has a specific souvenir linked, fetch donations for that item.
    // Note: The schema links Donation -> SouvenirItem, not directly Donation -> Project.
    // So we find donations that involve the SouvenirItem linked to this Project.
    
    const whereCondition: any = {};

    if (project.souvenirItemId) {
      whereCondition.souvenirItemId = project.souvenirItemId;
    } else {
      // If no souvenir is linked (e.g. Central Fund), we might need to look at 
      // DonationTransaction -> Project relation instead. 
      // But for this specific page (SouvenirDonationPage), it expects souvenir-based donations.
      return NextResponse.json([]); 
    }

    const donations = await prisma.donation.findMany({
      where: whereCondition,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            address: true,
            subdistrict: true,
            district: true,
            province: true,
            postalCode: true,
          },
        },
        souvenirItem: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            sku: true,
          },
        },
        shipments: {
          select: {
            id: true,
            status: true,
            trackingNo: true,
            shippedAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        },
      },
      orderBy: { donatedAt: "desc" },
    });

    return NextResponse.json(donations);
  } catch (error) {
    console.error("Error fetching project donations:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}