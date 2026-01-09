/**
 * Advanced Rate Limiting with Token Bucket Algorithm
 * More sophisticated than simple counting
 */

interface RateLimitBucket {
  tokens: number;
  lastRefill: number;
  maxTokens: number;
  refillRate: number; // tokens per second
}

interface RateLimitConfig {
  maxTokens: number;
  refillRate: number;
  burstCapacity: number;
}

const defaultConfig: RateLimitConfig = {
  maxTokens: 100,        // 100 requests per minute
  refillRate: 100 / 60,  // refill ~1.67 tokens per second
  burstCapacity: 200,    // allow burst up to 200
};

const bucketStore: { [key: string]: RateLimitBucket } = {};

// ==========================================
// 1. TOKEN BUCKET ALGORITHM
// ==========================================

function refillBucket(bucket: RateLimitBucket, now: number): void {
  const timePassed = (now - bucket.lastRefill) / 1000; // convert to seconds
  const tokensToAdd = timePassed * bucket.refillRate;
  bucket.tokens = Math.min(bucket.maxTokens, bucket.tokens + tokensToAdd);
  bucket.lastRefill = now;
}

export function checkAdvancedRateLimit(
  identifier: string,
  config: Partial<RateLimitConfig> = {}
): { allowed: boolean; remaining: number; resetAt: number } {
  const mergedConfig = { ...defaultConfig, ...config };
  const now = Date.now();
  const key = `rate_limit_${identifier}`;

  // Initialize bucket if not exists
  if (!bucketStore[key]) {
    bucketStore[key] = {
      tokens: mergedConfig.maxTokens,
      lastRefill: now,
      maxTokens: mergedConfig.maxTokens,
      refillRate: mergedConfig.refillRate,
    };
  }

  const bucket = bucketStore[key];

  // Refill tokens
  refillBucket(bucket, now);

  // Check if request is allowed
  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return {
      allowed: true,
      remaining: Math.floor(bucket.tokens),
      resetAt: now + (1000 / bucket.refillRate),
    };
  }

  return {
    allowed: false,
    remaining: 0,
    resetAt: now + (1000 / bucket.refillRate),
  };
}

// ==========================================
// 2. SLIDING WINDOW RATE LIMIT
// ==========================================

interface SlidingWindow {
  timestamps: number[];
  limit: number;
  window: number; // milliseconds
}

const slidingWindows: { [key: string]: SlidingWindow } = {};

export function checkSlidingWindowRateLimit(
  identifier: string,
  limit: number = 100,
  window: number = 60000 // 1 minute
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const key = `sliding_${identifier}`;

  if (!slidingWindows[key]) {
    slidingWindows[key] = {
      timestamps: [],
      limit,
      window,
    };
  }

  const slider = slidingWindows[key];

  // Remove old timestamps outside the window
  slider.timestamps = slider.timestamps.filter((ts) => now - ts < slider.window);

  // Check if request is allowed
  if (slider.timestamps.length < slider.limit) {
    slider.timestamps.push(now);
    return {
      allowed: true,
      remaining: slider.limit - slider.timestamps.length,
    };
  }

  return {
    allowed: false,
    remaining: 0,
  };
}

// ==========================================
// 3. ENDPOINT-SPECIFIC LIMITS
// ==========================================

const endpointLimits: { [key: string]: RateLimitConfig } = {
  // API endpoints
  'api.donation.get': { maxTokens: 1000, refillRate: 1000 / 60, burstCapacity: 2000 },
  'api.donation.create': { maxTokens: 50, refillRate: 50 / 60, burstCapacity: 100 },
  'api.auth.login': { maxTokens: 10, refillRate: 10 / 60, burstCapacity: 20 },
  'api.auth.register': { maxTokens: 5, refillRate: 5 / 60, burstCapacity: 10 },
  'api.upload': { maxTokens: 20, refillRate: 20 / 60, burstCapacity: 40 },
};

export function checkEndpointRateLimit(
  endpoint: string,
  userId: string
): { allowed: boolean; remaining: number; resetAt: number } {
  const config = endpointLimits[endpoint] || defaultConfig;
  const identifier = `${endpoint}:${userId}`;

  return checkAdvancedRateLimit(identifier, config);
}

// ==========================================
// 4. DISTRIBUTED RATE LIMIT (For multiple servers)
// ==========================================

interface DistributedRateLimitConfig {
  identifier: string;
  maxRequests: number;
  windowSeconds: number;
  serverId: string;
}

const distributedBuckets: { [key: string]: { count: number; windowStart: number } } = {};

export function checkDistributedRateLimit(config: DistributedRateLimitConfig): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  const now = Date.now();
  const key = config.identifier;
  const windowMs = config.windowSeconds * 1000;

  if (!distributedBuckets[key]) {
    distributedBuckets[key] = { count: 0, windowStart: now };
  }

  const bucket = distributedBuckets[key];

  // Reset window if expired
  if (now - bucket.windowStart > windowMs) {
    bucket.count = 0;
    bucket.windowStart = now;
  }

  // Check if allowed
  if (bucket.count < config.maxRequests) {
    bucket.count++;
    const remaining = config.maxRequests - bucket.count;
    const resetAt = bucket.windowStart + windowMs;

    return {
      allowed: true,
      remaining,
      resetAt,
    };
  }

  return {
    allowed: false,
    remaining: 0,
    resetAt: bucket.windowStart + windowMs,
  };
}

// ==========================================
// 5. CLEANUP OLD ENTRIES
// ==========================================

// Clean up old entries every hour
setInterval(() => {
  const now = Date.now();
  const oneHourAgo = now - 3600000;

  // Clean sliding windows
  Object.keys(slidingWindows).forEach((key) => {
    const window = slidingWindows[key];
    window.timestamps = window.timestamps.filter((ts) => ts > oneHourAgo);
    if (window.timestamps.length === 0) {
      delete slidingWindows[key];
    }
  });

  console.log('[RATE-LIMIT] Cleanup completed');
}, 3600000);

// ==========================================
// 6. STATISTICS
// ==========================================

export function getRateLimitStats(): {
  activeBuckets: number;
  activeWindows: number;
  totalLimitedRequests: number;
} {
  return {
    activeBuckets: Object.keys(bucketStore).length,
    activeWindows: Object.keys(slidingWindows).length,
    totalLimitedRequests: Object.values(slidingWindows).reduce((sum, w) => sum + w.timestamps.length, 0),
  };
}
