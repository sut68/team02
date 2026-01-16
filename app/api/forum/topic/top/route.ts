import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// GET - ดึงกระทู้ Top 5 ที่มีความคิดเห็นมากที่สุดใน 30 วัน หรือกระทู้ล่าสุดถ้าไม่มี
export async function GET(request: NextRequest) {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get all active topics and count comments in last 30 days
    const topics = await prisma.topic.findMany({
      where: {
        status: 'ACTIVE',
      },
      include: {
        category: {
          select: {
            id: true,
            categoryname: true,
          },
        },
        comments: {
          where: {
            status: 'ACTIVE',
            createddate: {
              gte: thirtyDaysAgo,
            },
          },
          select: {
            id: true,
          },
        },
      },
    });

    // Sort by comment count in last 30 days, tie-break by newest first
    const sortedTopics = topics
      .map((topic) => ({
        id: topic.id,
        title: topic.title,
        topicImage: topic.topicImage,
        category: topic.category,
        commentCount: topic.comments.length,
        createddate: topic.createddate,
      }))
      .filter((topic) => topic.commentCount > 0) // <--- เพิ่มบรรทัดนี้: กรองเฉพาะที่มีคอมเมนต์
      .sort((a, b) => {
        // Primary: comment count (descending)
        if (b.commentCount !== a.commentCount) {
          return b.commentCount - a.commentCount;
        }
        // Tie-breaker: newer topics first (descending by date)
        return new Date(b.createddate).getTime() - new Date(a.createddate).getTime();
      })
      .slice(0, 6); // Changed to 6 as per request

    // If no topics with comments, get recent topics instead
    if (sortedTopics.length === 0) {
      const recentTopics = await prisma.topic.findMany({
        where: {
          status: 'ACTIVE',
        },
        include: {
          category: {
            select: {
              id: true,
              categoryname: true,
            },
          },
        },
        orderBy: {
          createddate: 'desc',
        },
        take: 6,
      });

      const formattedRecentTopics = recentTopics.map((topic) => ({
        id: topic.id,
        title: topic.title,
        topicImage: topic.topicImage,
        category: topic.category,
        commentCount: 0,
      }));

      return NextResponse.json(
        { topics: formattedRecentTopics },
        { status: 200 }
      );
    }

    return NextResponse.json({ topics: sortedTopics }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    );
  }
}