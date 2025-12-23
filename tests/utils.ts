import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

export function createMockRequest(
  options: {
    method?: string;
    url?: string;
    cookies?: Record<string, string>;
    body?: FormData | object;
  } = {}
): NextRequest {
  const {
    method = 'GET',
    url = 'http://localhost:3000/api/test',
    cookies = {},
    body,
  } = options;

  const request = new NextRequest(url, {
    method,
    headers: {
      'Content-Type': body instanceof FormData ? 'multipart/form-data' : 'application/json',
    },
  });

  // Set cookies
  Object.entries(cookies).forEach(([key, value]) => {
    request.cookies.set(key, value);
  });

  // Mock formData if FormData is provided
  if (body instanceof FormData) {
    // @ts-ignore - Mock formData method
    request.formData = async () => body;
  }

  // Mock json if object is provided
  if (body && !(body instanceof FormData)) {
    // @ts-ignore - Mock json method
    request.json = async () => body;
  }

  return request;
}

export function createAuthToken(user: {
  userId: number;
  email: string;
  role: string;
}): string {
  return jwt.sign(user, JWT_SECRET);
}

export function createMockFile(
  name: string = 'test.jpg',
  size: number = 1024,
  type: string = 'image/jpeg'
): File {
  const blob = new Blob(['test content'], { type });
  return new File([blob], name, { type });
}

