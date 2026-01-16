import type { NextConfig } from "next";

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

// Warn if JWT_SECRET is default
if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
  console.warn('⚠️  WARNING: JWT_SECRET is too short. Use at least 32 characters for production.');
}

const nextConfig: NextConfig = {
  output: "standalone",
  
  // ==========================================
  // 1. IMAGE OPTIMIZATION FOR CDN
  // ==========================================
  images: {
    // Enable Next.js Image Optimization
    unoptimized: process.env.DISABLE_IMAGE_OPTIMIZATION === 'true',
    
    // Supported image formats (WebP for modern browsers)
    formats: ['image/webp', 'image/avif'],
    
    // Remote image domains for CDN
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
        pathname: '/image/upload/**',
      },
      {
        protocol: 'https',
        hostname: '**.sut-alumniconnect.me',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'team02storage.blob.core.windows.net', // ต้องใช้ชื่อนี้เท่านั้น
        pathname: '/**', // อนุญาตทุกโฟลเดอร์ในที่เก็บข้อมูลนี้
      },
      {
        protocol: 'https',
        hostname: 'cdn.example.com',
      },
    ],
    
    // Cache optimized images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    
    // Cache duration in seconds
    minimumCacheTTL: 60,
    
    // Dangerously allow svg
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // ==========================================
  // 2. STATIC ASSET COMPRESSION & CACHING
  // ==========================================
  compress: true,
  
  // ==========================================
  // 3. HEADERS FOR CDN CACHING
  // ==========================================
  async headers() {
    return [
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/uploads/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
  
  // ==========================================
  // 4. REDIRECTS FOR CDN OPTIMIZATION
  // ==========================================
  async redirects() {
    return [
      // Redirect old image URLs to CDN
      {
        source: '/images/:path*',
        destination: 'https://cdn.sut-alumniconnect.me/images/:path*',
        permanent: true,
      },
    ];
  },
  
  // ==========================================
  // 5. REWRITE FOR ORIGIN HIDING
  // ==========================================
  async rewrites() {
    return {
      beforeFiles: [
        // Rewrite to CDN bucket
        {
          source: '/cdn/:path*',
          destination: process.env.CDN_URL ? `${process.env.CDN_URL}/:path*` : '/:path*',
        },
      ],
    };
  },
  
};

export default nextConfig;
