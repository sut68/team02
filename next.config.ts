import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true, // เก็บอันนี้ไว้ได้ ถ้า Server ไม่แรงหรือไม่ได้ลง library จัดการรูป
  },
}

export default nextConfig;
