import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Define protected routes
const protectedRoutes = {
  admin: ['/admin'],
  user: ['/user'],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Security Headers
  const headers = new Headers(request.headers);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Get token from cookies
  const token = request.cookies.get('token')?.value;

  // Check if route requires authentication
  const isAdminRoute = protectedRoutes.admin.some((route) => pathname.startsWith(route));
  const isUserRoute = protectedRoutes.user.some((route) => pathname.startsWith(route));

  // If not a protected route, allow access with security headers
  if (!isAdminRoute && !isUserRoute) {
    const response = NextResponse.next();
    headers.forEach((value, key) => response.headers.set(key, value));
    return response;
  }

  // If no token, redirect to login
  if (!token) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    // Verify token using jose (Edge Runtime compatible)
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || '');
    const { payload } = await jwtVerify(token, secret);

    const decoded = payload as {
      userId: number;
      email: string;
      userType: string;
    };

    // Check admin access
    if (isAdminRoute && decoded.userType !== 'admin') {
      return NextResponse.redirect(new URL('/user/news', request.url));
    }

    // Allow access with security headers
    const response = NextResponse.next();
    headers.forEach((value, key) => response.headers.set(key, value));
    return response;
  } catch (error) {
    // Invalid token, redirect to login
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    
    const response = NextResponse.redirect(loginUrl);
    // Clear invalid token
    response.cookies.set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
    
    return response;
  }
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    '/admin/:path*',
    '/user/:path*',
  ],
};
