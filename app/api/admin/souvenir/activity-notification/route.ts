import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/admin/souvenir/activity-notification
 * 
 * This endpoint is called when a souvenir is claimed at /admin/booking/success
 * It serves as a trigger for the activity page to refresh its data.
 * The actual data refresh is handled by polling on the client side.
 */

export async function POST(request: NextRequest) {
  try {
    const { contentId, userId, action } = await request.json();

    if (!contentId || !userId || !action) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // This endpoint is primarily a notification trigger.
    // The actual data is fetched by the client-side polling mechanism.
    // We can extend this later to update caches or trigger server-sent events if needed.

    return NextResponse.json({
      success: true,
      message: "Activity notification received",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Activity notification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
