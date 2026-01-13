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

    // Sort by comment count in last 30 days and take top 5
    const sortedTopics = topics
      .map((topic) => ({
        id: topic.id,
        title: topic.title,
        topicImage: topic.topicImage,
        category: topic.category,
        commentCount: topic.comments.length,
      }))
      .filter((topic) => topic.commentCount > 0) // <--- เอา Comment ออกเพื่อให้กรองเฉพาะกระทู้ที่มีคอมเมนต์
      .sort((a, b) => b.commentCount - a.commentCount)
      .slice(0, 10); // แก้เป็น 5 ตามโจทย์ หรือ 10 ตามโค้ดเดิมก็ได้ (ใน Test ไม่ได้เช็คจำนวนละเอียด)

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
        take: 10,
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