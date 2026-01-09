// ============================================================================
// 1. MOCKING DEPENDENCIES (must be before imports)
// ============================================================================

// Mock Next.js modules - use manual mock
jest.mock('next/server');

// Mock Prisma Client
jest.mock('@/app/lib/prisma', () => ({
  prisma: {
    topic: {
      findMany: jest.fn(),
    },
  },
}));

// Import after mocks
import { GET } from '@/app/api/forum/topic/top/route';
import { prisma } from '@/app/lib/prisma';
import * as NextServer from 'next/server';

// ============================================================================
// 2. HELPER FUNCTIONS
// ============================================================================

const createGetRequest = () => {
  const url = 'http://localhost:3000/api/forum/topic/top';
  return new NextServer.NextRequest(url, {
    method: 'GET',
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
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

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
      expect(json.topics[0].id).toBe(3); // Topic with 5 comments (most)
      expect(json.topics[0].commentCount).toBe(5);
      expect(json.topics[1].id).toBe(1); // Topic with 3 comments
      expect(json.topics[1].commentCount).toBe(3);
      expect(json.topics[2].id).toBe(2); // Topic with 2 comments
      expect(json.topics[2].commentCount).toBe(2);
      expect(json.topics[0]).toHaveProperty('title');
      expect(json.topics[0]).toHaveProperty('topicImage');
      expect(json.topics[0]).toHaveProperty('category');
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
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

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
          comments: [], // No comments in last 30 days
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
          comments: [], // No comments in last 30 days
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
        {
          id: 4,
          title: 'Recent Topic 2',
          topicImage: 'image4.jpg',
          status: 'ACTIVE',
          createddate: new Date('2024-12-02'),
          category: {
            id: 2,
            categoryname: 'Category 2',
          },
        },
      ];

      (prisma.topic.findMany as jest.Mock)
        .mockResolvedValueOnce(mockTopicsNoComments)
        .mockResolvedValueOnce(mockRecentTopics);

      const req = createGetRequest();
      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.topics).toBeDefined();
      expect(json.topics).toHaveLength(2);
      expect(json.topics[0].id).toBe(3);
      expect(json.topics[0].commentCount).toBe(0);
      expect(json.topics[1].id).toBe(4);
      expect(json.topics[1].commentCount).toBe(0);
      expect(prisma.topic.findMany).toHaveBeenCalledTimes(2);
    });
  });
});

