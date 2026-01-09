import { NextRequest } from 'next/server';
import { POST } from '@/app/api/forum/topic/route';
import { prisma } from '@/app/lib/prisma';
import { createMockRequest } from '@/tests/utils';

// ============================================================================
// 1. MOCKING DEPENDENCIES
// ============================================================================

// Mock Prisma Client
jest.mock('@/app/lib/prisma', () => ({
  prisma: {
    topic: {
      create: jest.fn(),
    },
  },
}));

// ============================================================================
// 2. HELPER FUNCTIONS
// ============================================================================

const createPostRequest = (body: any) => {
  const url = 'http://localhost:3000/api/forum/topic';
  return createMockRequest({
    method: 'POST',
    url,
    body,
  });
};

// ============================================================================
// 3. TEST SUITE
// ============================================================================

describe('Forum Topic API - POST', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // Positive Test Case
  // --------------------------------------------------------------------------
  it('TC-TOPIC-POST-01: Should create topic successfully', async () => {
    const mockTopic = {
      id: 1,
      title: 'Test Topic',
      content: 'This is a test topic content',
      topicImage: 'test-image.jpg',
      user_id: 1,
      category_id: 1,
      status: 'ACTIVE',
      createddate: new Date(),
      lastactivitydate: new Date(),
      user: {
        id: 1,
        fullName: 'Test User',
        email: 'test@example.com',
      },
      category: {
        id: 1,
        categoryname: 'Test Category',
      },
    };

    (prisma.topic.create as jest.Mock).mockResolvedValue(mockTopic);

    const req = createPostRequest({
      title: 'Test Topic',
      content: 'This is a test topic content',
      topicImage: 'test-image.jpg',
      user_id: 1,
      category_id: 1,
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.message).toBe('สร้างกระทู้สำเร็จ');
    expect(json.topic).toBeDefined();
    expect(json.topic.title).toBe('Test Topic');
    expect(json.topic.content).toBe('This is a test topic content');
    expect(json.topic.user_id).toBe(1);
    expect(json.topic.category_id).toBe(1);
    expect(json.topic.status).toBe('ACTIVE');
    expect(prisma.topic.create).toHaveBeenCalledWith({
      data: {
        title: 'Test Topic',
        content: 'This is a test topic content',
        topicImage: 'test-image.jpg',
        user_id: 1,
        category_id: 1,
        status: 'ACTIVE',
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        category: true,
      },
    });
  });

  // --------------------------------------------------------------------------
  // Negative Test Case 1: Missing Required Fields
  // --------------------------------------------------------------------------
  it('TC-TOPIC-POST-02: Should return 400 error when required fields are missing', async () => {
    const req = createPostRequest({
      title: 'Test Topic',
      // Missing content, user_id, and category_id
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe('กรุณากรอกข้อมูลให้ครบถ้วน');
    expect(prisma.topic.create).not.toHaveBeenCalled();
  });

  // --------------------------------------------------------------------------
  // Negative Test Case 2: Database Error
  // --------------------------------------------------------------------------
  it('TC-TOPIC-POST-03: Should return 500 error when database operation fails', async () => {
    const dbError = new Error('Database connection failed');
    (prisma.topic.create as jest.Mock).mockRejectedValue(dbError);

    const req = createPostRequest({
      title: 'Test Topic',
      content: 'This is a test topic content',
      topicImage: 'test-image.jpg',
      user_id: 1,
      category_id: 1,
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe('เกิดข้อผิดพลาดในการสร้างกระทู้');
  });
});

