import { NextRequest } from 'next/server';
import { POST, DELETE } from '@/app/api/forum/topic/[id]/comment/route';
import { prisma } from '@/app/lib/prisma';
import jwt from 'jsonwebtoken';
import { createMockRequest } from '@/tests/utils';

// ============================================================================
// 1. MOCKING DEPENDENCIES
// ============================================================================

// Mock Prisma Client
jest.mock('@/app/lib/prisma', () => ({
  prisma: {
    topic: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    comment: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    contentManagementLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

// Mock JWT
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
  sign: jest.fn().mockReturnValue('mock_token'),
}));

// ============================================================================
// 2. HELPER FUNCTIONS
// ============================================================================

const mockUser = {
  userId: 1,
  email: 'user@test.com',
  role: 'STUDENT',
};

const mockAdmin = {
  userId: 2,
  email: 'admin@test.com',
  role: 'ADMIN',
};

const mockLogin = (user = mockUser) => {
  (jwt.verify as jest.Mock).mockReturnValue(user);
};

const createPostRequest = (topicId: number, body: any) => {
  const url = `http://localhost:3000/api/forum/topic/${topicId}/comment`;
  const req = createMockRequest({
    method: 'POST',
    url,
    cookies: { token: 'fake-valid-token' },
    body,
  });
  return req;
};

const createDeleteRequest = (topicId: number, commentId: number, body: any) => {
  const url = `http://localhost:3000/api/forum/topic/${topicId}/comment?commentId=${commentId}`;
  const req = createMockRequest({
    method: 'DELETE',
    url,
    cookies: { token: 'fake-valid-token' },
    body,
  });
  return req;
};

// ============================================================================
// 3. TEST SUITE
// ============================================================================

describe('Forum Comment API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // Group 1: POST - Create Comment
  // --------------------------------------------------------------------------
  describe('POST - Create Comment', () => {
    const topicId = 1;
    const mockTopic = {
      id: topicId,
      status: 'ACTIVE',
    };

    const mockComment = {
      id: 1,
      content: 'Test comment',
      topic_id: topicId,
      user_id: mockUser.userId,
      status: 'ACTIVE',
      user: {
        id: mockUser.userId,
        fullName: 'Test User',
        email: mockUser.email,
        role: mockUser.role,
      },
    };

    it('TC-COMMENT-POST-01: Should create comment successfully', async () => {
      mockLogin();
      
      // Mock topic exists and is active
      (prisma.topic.findUnique as jest.Mock).mockResolvedValue(mockTopic);
      
      // Mock transaction
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          comment: {
            create: jest.fn().mockResolvedValue(mockComment),
          },
          topic: {
            update: jest.fn().mockResolvedValue({}),
          },
        };
        return await callback(tx);
      });

      const req = createPostRequest(topicId, { content: 'Test comment' });
      const res = await POST(req, { params: Promise.resolve({ id: topicId.toString() }) });
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.message).toBe('เพิ่มความคิดเห็นสำเร็จ');
      expect(json.comment).toBeDefined();
      expect(json.comment.content).toBe('Test comment');
    });

    it('TC-COMMENT-POST-02: Should return 400 if content is missing', async () => {
      mockLogin();
      
      (prisma.topic.findUnique as jest.Mock).mockResolvedValue(mockTopic);

      const req = createPostRequest(topicId, { content: '' });
      const res = await POST(req, { params: Promise.resolve({ id: topicId.toString() }) });
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toBe('กรุณากรอกความคิดเห็น');
    });

    it('TC-COMMENT-POST-03: Should return 404 if topic does not exist', async () => {
      mockLogin();
      
      (prisma.topic.findUnique as jest.Mock).mockResolvedValue(null);

      const req = createPostRequest(topicId, { content: 'Test comment' });
      const res = await POST(req, { params: Promise.resolve({ id: topicId.toString() }) });
      const json = await res.json();

      expect(res.status).toBe(404);
      expect(json.error).toBe('ไม่พบกระทู้');
    });
  });

  // --------------------------------------------------------------------------
  // Group 2: DELETE - Delete Comment
  // --------------------------------------------------------------------------
  describe('DELETE - Delete Comment', () => {
    const topicId = 1;
    const commentId = 1;
    const mockComment = {
      id: commentId,
      topic_id: topicId,
      status: 'ACTIVE',
    };

    it('TC-COMMENT-DELETE-01: Should delete comment successfully as admin', async () => {
      mockLogin(mockAdmin);
      
      // Mock transaction
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          comment: {
            findUnique: jest.fn().mockResolvedValue(mockComment),
            update: jest.fn().mockResolvedValue({}),
          },
          topic: {
            update: jest.fn().mockResolvedValue({}),
          },
          contentManagementLog: {
            create: jest.fn().mockResolvedValue({}),
          },
        };
        return await callback(tx);
      });

      const req = createDeleteRequest(topicId, commentId, {
        reasonForDeletion: 'PROFANITY_INSULTS',
      });
      const res = await DELETE(req, { params: Promise.resolve({ id: topicId.toString() }) });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.message).toBe('ลบความคิดเห็นสำเร็จ');
    });

    it('TC-COMMENT-DELETE-02: Should return 403 if user is not admin', async () => {
      mockLogin(mockUser); // Regular user, not admin

      const req = createDeleteRequest(topicId, commentId, {
        reasonForDeletion: 'PROFANITY_INSULTS',
      });
      const res = await DELETE(req, { params: Promise.resolve({ id: topicId.toString() }) });
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.error).toBe('คุณไม่มีสิทธิ์ลบความคิดเห็น');
    });

    it('TC-COMMENT-DELETE-03: Should return 400 if reasonForDeletion is missing', async () => {
      mockLogin(mockAdmin);

      const req = createDeleteRequest(topicId, commentId, {});
      const res = await DELETE(req, { params: Promise.resolve({ id: topicId.toString() }) });
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toBe('กรุณาเลือกเหตุผลในการลบ');
    });
  });
});

