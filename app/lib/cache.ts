/**
 * Redis Caching System for Scalability
 * Automatically falls back to no caching if Redis is unavailable
 */

let redisModule: any;
try {
  redisModule = require('redis');
} catch (e) {
  console.warn('[CACHE] Redis module not available at startup');
}

type RedisClientType = any;
let redisClient: RedisClientType | null = null;
let isRedisAvailable = false;

// Initialize Redis (non-blocking)
async function initializeRedis() {
  try {
    if (!redisModule || !redisModule.createClient) {
      throw new Error('Redis module not available');
    }

    redisClient = redisModule.createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        reconnectStrategy: (retries: number) => {
          if (retries > 3) {
            console.warn('[CACHE] Redis reconnection failed, continuing without cache');
            return new Error('Max retries');
          }
          return retries * 50;
        },
      },
    });

    redisClient.on('error', (err: Error) => {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.warn('[CACHE] Redis error:', errorMsg);
      isRedisAvailable = false;
    });

    redisClient.on('connect', () => {
      console.log('[CACHE] Redis connected ✅');
      isRedisAvailable = true;
    });

    await redisClient.connect();
    isRedisAvailable = true;
  } catch (error) {
    console.warn('[CACHE] Redis initialization skipped - will operate without caching');
    isRedisAvailable = false;
    redisClient = null;
  }
}

// Auto-initialize on module load
initializeRedis();

// ==========================================
// 1. DONATION PROJECTS CACHE
// ==========================================

export async function getCachedDonationProjects(filter?: string): Promise<any> {
  const cacheKey = `donation_projects_${filter || 'all'}`;

  try {
    if (!isRedisAvailable || !redisClient) return null;

    const cached = await redisClient.get(cacheKey);
    if (cached) {
      console.log(`[CACHE] Hit: ${cacheKey}`);
      return JSON.parse(cached);
    }
  } catch (error) {
    console.warn(`[CACHE] Get error for ${cacheKey}:`, error);
  }

  return null;
}

export async function setCachedDonationProjects(
  data: any,
  filter?: string,
  ttl: number = 3600 // 1 hour
): Promise<void> {
  const cacheKey = `donation_projects_${filter || 'all'}`;

  try {
    if (!isRedisAvailable || !redisClient) return;

    await redisClient.setEx(cacheKey, ttl, JSON.stringify(data));
    console.log(`[CACHE] Set: ${cacheKey} (TTL: ${ttl}s)`);
  } catch (error) {
    console.warn(`[CACHE] Set error for ${cacheKey}:`, error);
    // Continue without caching
  }
}

export async function invalidateDonationCache(): Promise<void> {
  try {
    if (!isRedisAvailable || !redisClient) return;

    const patterns = ['donation_projects_*'];
    for (const pattern of patterns) {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
        console.log(`[CACHE] Invalidated: ${pattern}`);
      }
    }
  } catch (error) {
    console.warn('[CACHE] Invalidation error:', error);
  }
}

// ==========================================
// 2. USER PROFILE CACHE
// ==========================================

export async function getCachedUser(userId: number): Promise<any> {
  const cacheKey = `user_${userId}`;

  try {
    if (!isRedisAvailable || !redisClient) return null;

    const cached = await redisClient.get(cacheKey);
    if (cached) {
      console.log(`[CACHE] Hit: ${cacheKey}`);
      return JSON.parse(cached);
    }
  } catch (error) {
    console.warn(`[CACHE] Get error for ${cacheKey}:`, error);
  }

  return null;
}

export async function setCachedUser(userId: number, data: any, ttl: number = 1800): Promise<void> {
  const cacheKey = `user_${userId}`;

  try {
    if (!isRedisAvailable || !redisClient) return;

    await redisClient.setEx(cacheKey, ttl, JSON.stringify(data));
    console.log(`[CACHE] Set: ${cacheKey}`);
  } catch (error) {
    console.warn(`[CACHE] Set error for ${cacheKey}:`, error);
  }
}

// ==========================================
// 3. GENERIC CACHE FUNCTIONS
// ==========================================

export async function getFromCache<T>(key: string): Promise<T | null> {
  try {
    if (!isRedisAvailable || !redisClient) return null;

    const cached = await redisClient.get(key);
    if (cached) {
      return JSON.parse(cached) as T;
    }
  } catch (error) {
    console.warn(`[CACHE] Get error for ${key}:`, error);
  }

  return null;
}

export async function setInCache<T>(key: string, data: T, ttl: number = 3600): Promise<void> {
  try {
    if (!isRedisAvailable || !redisClient) return;

    await redisClient.setEx(key, ttl, JSON.stringify(data));
    console.log(`[CACHE] Set: ${key} (TTL: ${ttl}s)`);
  } catch (error) {
    console.warn(`[CACHE] Set error for ${key}:`, error);
  }
}

export async function invalidateCache(pattern: string): Promise<void> {
  try {
    if (!isRedisAvailable || !redisClient) return;

    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log(`[CACHE] Invalidated pattern: ${pattern} (${keys.length} keys)`);
    }
  } catch (error) {
    console.warn(`[CACHE] Invalidation error for ${pattern}:`, error);
  }
}

// ==========================================
// 4. CACHE STATISTICS
// ==========================================

export async function getCacheStats(): Promise<{
  connected: boolean;
  dbSize: number;
  info: string;
}> {
  if (!isRedisAvailable || !redisClient) {
    return { connected: false, dbSize: 0, info: 'Redis not available' };
  }

  try {
    const dbSize = await redisClient.dbSize();
    const info = await redisClient.info('stats');

    return {
      connected: true,
      dbSize,
      info: info || 'No info',
    };
  } catch (error) {
    console.warn('[CACHE] Stats error:', error);
    return {
      connected: false,
      dbSize: 0,
      info: 'Error fetching stats',
    };
  }
}

// ==========================================
// 5. CLEANUP & EXPORT
// ==========================================

// Graceful shutdown
process.on('SIGTERM', async () => {
  if (redisClient) {
    console.log('[CACHE] Closing Redis connection...');
    await redisClient.quit();
  }
});

export { isRedisAvailable, redisClient };
