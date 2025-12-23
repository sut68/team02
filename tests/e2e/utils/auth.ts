import { APIRequestContext, BrowserContext } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3050';

/**
 * Login as a user and return context with cookies
 */
export async function loginAsUser(
  request: APIRequestContext,
  email: string = 'user@test.com',
  password: string = 'password123'
): Promise<APIRequestContext> {
  const response = await request.post(`${BASE_URL}/api/auth/login`, {
    data: {
      email,
      password,
    },
  });

  if (!response.ok()) {
    const error = await response.text();
    throw new Error(`Login failed: ${error}`);
  }

  // Return the request context which now has cookies
  return request;
}

/**
 * Login as admin
 */
export async function loginAsAdmin(
  request: APIRequestContext,
  email: string = 'admin@test.com',
  password: string = 'password123'
): Promise<APIRequestContext> {
  return loginAsUser(request, email, password);
}

/**
 * Login and get cookies, then set them in browser context
 */
export async function loginAndSetCookies(
  context: BrowserContext,
  request: APIRequestContext,
  email: string = 'user@test.com',
  password: string = 'password123'
): Promise<void> {
  // Create a new request context to get cookies
  const response = await request.post(`${BASE_URL}/api/auth/login`, {
    data: {
      email,
      password,
    },
  });

  if (!response.ok()) {
    const error = await response.text();
    throw new Error(`Login failed: ${error}`);
  }

  // Get cookies from the response
  const setCookieHeader = response.headers()['set-cookie'];
  if (!setCookieHeader) {
    throw new Error('No cookies received from login');
  }

  const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
  const baseUrl = new URL(BASE_URL);
  
  const parsedCookies = cookies.map(cookieString => {
    const [nameValue, ...attributes] = cookieString.split(';');
    const [name, value] = nameValue.split('=');
    
    const cookie: any = {
      name: name.trim(),
      value: value.trim(),
      domain: baseUrl.hostname,
      path: '/',
      httpOnly: true,
      sameSite: 'Lax' as const,
    };

    // Parse additional attributes
    for (const attr of attributes) {
      const trimmed = attr.trim();
      if (trimmed.toLowerCase() === 'httponly') {
        cookie.httpOnly = true;
      } else if (trimmed.toLowerCase() === 'secure') {
        cookie.secure = true;
      } else if (trimmed.toLowerCase().startsWith('samesite')) {
        const val = trimmed.split('=')[1]?.toLowerCase();
        cookie.sameSite = (val === 'strict' ? 'Strict' : val === 'none' ? 'None' : 'Lax') as 'Strict' | 'Lax' | 'None';
      } else if (trimmed.toLowerCase().startsWith('max-age')) {
        cookie.maxAge = parseInt(trimmed.split('=')[1] || '0', 10);
      }
    }

    return cookie;
  }).filter(cookie => cookie.name && cookie.value);

  await context.addCookies(parsedCookies);
}

