import { NextRequest, NextResponse } from 'next/server';

type RateLimitStore = {
  [key: string]: {
    count: number;
    resetTime: number;
  };
};

const store: RateLimitStore = {};

// ทำความสะอาด store เก่าทุก 1 ชั่วโมง
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 60 * 60 * 1000);

export function rateLimit(options: {
  interval: number; // milliseconds
  maxRequests: number;
}) {
  return async (req: NextRequest): Promise<NextResponse | null> => {
    // ใช้ IP address เป็น key
    const ip = req.headers.get('x-forwarded-for') || 
               req.headers.get('x-real-ip') || 
               'unknown';
    
    const key = `${ip}`;
    const now = Date.now();

    if (!store[key] || store[key].resetTime < now) {
      // สร้าง entry ใหม่หรือ reset
      store[key] = {
        count: 1,
        resetTime: now + options.interval,
      };
      return null; // อนุญาต
    }

    store[key].count++;

    if (store[key].count > options.maxRequests) {
      // เกินจำนวนที่อนุญาต
      const retryAfter = Math.ceil((store[key].resetTime - now) / 1000);
      return NextResponse.json(
        { error: `พยายามมากเกินไป กรุณารออีก ${retryAfter} วินาที` },
        { 
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
          },
        }
      );
    }

    return null; // อนุญาต
  };
}

// Rate limiters
export const loginLimiter = rateLimit({
  interval: 15 * 60 * 1000, // 15 นาที
  maxRequests: 5,
});

export const registerLimiter = rateLimit({
  interval: 60 * 60 * 1000, // 1 ชั่วโมง
  maxRequests: 3,
});

export const apiLimiter = rateLimit({
  interval: 15 * 60 * 1000, // 15 นาที
  maxRequests: 100,
});
