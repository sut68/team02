import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { logSecurityEvent } from '@/app/lib/security-edge';

// Define protected routes
const protectedRoutes = {
  admin: ['/admin'],
  user: ['/user'],
  api: ['/api/user'], // Protected API routes
};

// Define auth routes (should not be accessible when logged in)
const authRoutes = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get client IP for logging and security monitoring
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  // Enhanced Security Headers - Comprehensive Protection
  const headers = new Headers(request.headers);
  
  // HSTS: Force HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }
  
  // XSS Protection
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  
  // Referrer Policy
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Content Security Policy - Comprehensive
  const cspHeader = process.env.NODE_ENV === 'production'
    ? "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none';"
    : "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' ws:;";
  headers.set('Content-Security-Policy', cspHeader);

  // Get token from cookies
  const token = request.cookies.get('token')?.value;

  // Check if route is an auth route
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Check if route requires authentication
  const isAdminRoute = protectedRoutes.admin.some((route) => pathname.startsWith(route));
  const isUserRoute = protectedRoutes.user.some((route) => pathname.startsWith(route));
  const isApiRoute = protectedRoutes.api.some((route) => pathname.startsWith(route));

  // If user is logged in and trying to access auth routes, redirect to user/news
  if (isAuthRoute && token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || '');
      await jwtVerify(token, secret);
      // Token is valid, redirect to user/news
      return NextResponse.redirect(new URL('/user/news', request.url));
    } catch (error) {
      // Token is invalid, allow access to auth routes
    }
  }

  // If it's an auth route without valid token, always allow access
  if (isAuthRoute && !token) {
    const response = NextResponse.next();
    headers.forEach((value, key) => response.headers.set(key, value));
    return response;
  }

  // If not a protected route and not an auth route, allow access with security headers
  if (!isAdminRoute && !isUserRoute && !isApiRoute && !isAuthRoute) {
    const response = NextResponse.next();
    headers.forEach((value, key) => response.headers.set(key, value));
    return response;
  }

  // If no token, redirect to login (for page routes) or return 401 (for API routes)
  if (!token) {
    if (isApiRoute) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลการยืนยันตัวตน' },
        { status: 401 }
      );
    }
    // For auth routes, allow access even without token
    if (isAuthRoute) {
      const response = NextResponse.next();
      headers.forEach((value, key) => response.headers.set(key, value));
      return response;
    }
    // For protected routes, redirect to login
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
      role: string;
      iat?: number;
      exp?: number;
    };

    // Validate token expiry
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      throw new Error('Token expired');
    }

    // Check admin access
    if (isAdminRoute && decoded.role !== 'ADMIN') {
      logSecurityEvent('UNAUTHORIZED_ACCESS', `Non-admin attempted admin access from ${clientIp}`, clientIp, decoded.userId.toString());
      return NextResponse.redirect(new URL('/user/news', request.url));
    }

    // Allow access with security headers and user info
    const response = NextResponse.next();
    headers.forEach((value, key) => response.headers.set(key, value));
    
    // Add user info to headers for API routes
    response.headers.set('x-user-id', decoded.userId.toString());
    response.headers.set('x-user-email', decoded.email);
    response.headers.set('x-user-role', decoded.role);
    
    // Log successful authentication
    logSecurityEvent('AUTH_SUCCESS', `User ${decoded.email} authenticated`, clientIp, decoded.userId.toString());
    
    return response;
  } catch (error) {
    // Invalid token, redirect to login for page routes or return 401 for API routes
    const currentIsApiRoute = protectedRoutes.api.some((route) => pathname.startsWith(route));
    
    // Log authentication failure
    logSecurityEvent('AUTH_FAILURE', `Invalid token for ${pathname} from ${clientIp}`, clientIp);
    
    if (currentIsApiRoute) {
      return NextResponse.json(
        { error: 'Token ไม่ถูกต้อง' },
        { status: 401 }
      );
    }
    
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
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/admin/:path*',
    '/user/:path*',
    '/api/user/:path*',
  ],
};
