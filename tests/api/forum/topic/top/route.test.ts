import { GET } from '@/app/api/forum/topic/top/route';
import { prisma } from '@/app/lib/prisma';
import { createMockRequest } from '@/tests/utils'; // ใช้ utils ที่มีอยู่แล้ว

// ============================================================================
// 1. MOCKING DEPENDENCIES
// ============================================================================

// ไม่ต้อง Mock next/server เพื่อให้ NextResponse ทำงานได้จริง
// jest.mock('next/server'); <--- ลบบรรทัดนี้ทิ้ง

// Mock Prisma Client
jest.mock('@/app/lib/prisma', () => ({
  prisma: {
    topic: {
      findMany: jest.fn(),
    },
  },
}));

// ============================================================================
// 2. HELPER FUNCTIONS
// ============================================================================

const createGetRequest = () => {
  const url = 'http://localhost:3000/api/forum/topic/top';
  // ใช้ createMockRequest จาก utils หรือ new NextRequest ของจริงก็ได้
  return createMockRequest({
    method: 'GET',
    url,
  });
};

// ============================================================================
// 3. TEST SUITE
// ============================================================================

describe('Forum Top Topics API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // Positive Test Case
  // --------------------------------------------------------------------------
  describe('GET - Fetch Top Topics', () => {
    it('TC-TOP-01: Should return top 5 topics with most comments in last 30 days', async () => {
      const mockTopics = [
        {
          id: 1,
          title: 'Topic 1',
          topicImage: 'image1.jpg',
          status: 'ACTIVE',
          createddate: new Date('2024-01-01'),
          category: {
            id: 1,
            categoryname: 'Category 1',
          },
          comments: [
            { id: 1 },
            { id: 2 },
            { id: 3 },
          ],
        },
        {
          id: 2,
          title: 'Topic 2',
          topicImage: 'image2.jpg',
          status: 'ACTIVE',
          createddate: new Date('2024-01-02'),
          category: {
            id: 2,
            categoryname: 'Category 2',
          },
          comments: [
            { id: 4 },
            { id: 5 },
          ],
        },
        {
          id: 3,
          title: 'Topic 3',
          topicImage: 'image3.jpg',
          status: 'ACTIVE',
          createddate: new Date('2024-01-03'),
          category: {
            id: 1,
            categoryname: 'Category 1',
          },
          comments: [
            { id: 6 },
            { id: 7 },
            { id: 8 },
            { id: 9 },
            { id: 10 },
          ],
        },
      ];

      (prisma.topic.findMany as jest.Mock).mockResolvedValueOnce(mockTopics);

      const req = createGetRequest();
      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.topics).toBeDefined();
      expect(json.topics).toHaveLength(3);
      
      // เรียงลำดับตามจำนวน comment มาก -> น้อย
      expect(json.topics[0].id).toBe(3); // 5 comments
      expect(json.topics[0].commentCount).toBe(5);
      
      expect(json.topics[1].id).toBe(1); // 3 comments
      expect(json.topics[1].commentCount).toBe(3);
      
      expect(json.topics[2].id).toBe(2); // 2 comments
      expect(json.topics[2].commentCount).toBe(2);

      expect(prisma.topic.findMany).toHaveBeenCalledWith({
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
                gte: expect.any(Date),
              },
            },
            select: {
              id: true,
            },
          },
        },
      });
    });

    // --------------------------------------------------------------------------
    // Negative Test Case 1: Database Error
    // --------------------------------------------------------------------------
    it('TC-TOP-02: Should return 500 error when database query fails', async () => {
      const dbError = new Error('Database connection failed');
      (prisma.topic.findMany as jest.Mock).mockRejectedValueOnce(dbError);

      const req = createGetRequest();
      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(500);
      expect(json.error).toBe('เกิดข้อผิดพลาดในการดึงข้อมูล');
    });

    // --------------------------------------------------------------------------
    // Negative Test Case 2: No topics with comments in last 30 days
    // --------------------------------------------------------------------------
    it('TC-TOP-03: Should return recent topics when no topics have comments in last 30 days', async () => {
      // First call: topics with no comments in last 30 days
      const mockTopicsNoComments = [
        {
          id: 1,
          title: 'Topic 1',
          topicImage: 'image1.jpg',
          status: 'ACTIVE',
          createddate: new Date('2024-01-01'),
          category: {
            id: 1,
            categoryname: 'Category 1',
          },
          comments: [], // No comments
        },
      ];

      // Second call: recent topics (fallback)
      const mockRecentTopics = [
        {
          id: 3,
          title: 'Recent Topic 1',
          topicImage: 'image3.jpg',
          status: 'ACTIVE',
          createddate: new Date('2024-12-01'),
          category: {
            id: 1,
            categoryname: 'Category 1',
          },
        },
      ];

      (prisma.topic.findMany as jest.Mock)
        .mockResolvedValueOnce(mockTopicsNoComments) // สำหรับการค้นหาครั้งแรก
        .mockResolvedValueOnce(mockRecentTopics);    // สำหรับการค้นหา fallback

      const req = createGetRequest();
      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.topics).toBeDefined();
      expect(json.topics[0].id).toBe(3); // ต้องได้ Topic จาก fallback
      expect(json.topics[0].commentCount).toBe(0);
      expect(prisma.topic.findMany).toHaveBeenCalledTimes(2);
    });
  });
});