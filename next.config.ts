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
  images: {
    unoptimized: true, // เก็บอันนี้ไว้ได้ ถ้า Server ไม่แรงหรือไม่ได้ลง library จัดการรูป
  },
}

export default nextConfig;
