/**
 * Health Monitoring Endpoint
 * Used by load balancers and monitoring systems
 * Returns detailed system health status
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getCacheStats } from '@/app/lib/cache';
import { getRateLimitStats } from '@/app/lib/rate-limit-advanced';
import { getQueueStats } from '@/app/lib/queue-stub';
import os from 'os';

export const runtime = 'nodejs';

// ==========================================
// HEALTH CHECK UTILITIES
// ==========================================

function getMemoryUsage() {
  const used = process.memoryUsage();
  return {
    rss: Math.round((used.rss / 1024 / 1024) * 100) / 100, // MB
    heapTotal: Math.round((used.heapTotal / 1024 / 1024) * 100) / 100,
    heapUsed: Math.round((used.heapUsed / 1024 / 1024) * 100) / 100,
    external: Math.round((used.external / 1024 / 1024) * 100) / 100,
    heapUsagePercent: Math.round((used.heapUsed / used.heapTotal) * 100),
  };
}

function getCPUUsage() {
  const cpus = os.cpus();
  const loadAverage = os.loadavg();

  return {
    cores: cpus.length,
    loadAverage: {
      oneMinute: loadAverage[0],
      fiveMinutes: loadAverage[1],
      fifteenMinutes: loadAverage[2],
    },
    model: cpus[0]?.model || 'Unknown',
    uptime: process.uptime(),
  };
}

async function checkDatabaseConnection(): Promise<{
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  poolStatus?: any;
}> {
  const startTime = Date.now();

  try {
    // Simple query to check DB connection
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - startTime;

    return {
      status: responseTime > 1000 ? 'degraded' : 'healthy',
      responseTime,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
    };
  }
}

async function checkRedisConnection(): Promise<{
  status: 'healthy' | 'unavailable';
  responseTime?: number;
  stats?: any;
}> {
  try {
    const stats = await getCacheStats();

    if (stats && typeof stats === 'object' && 'connected' in stats) {
      const connected = (stats as any).connected;
      return {
        status: connected ? 'healthy' : 'unavailable',
        stats: {
          connected,
          hits: (stats as any).hits,
          misses: (stats as any).misses,
          hitRate: (stats as any).hitRate,
        },
      };
    }

    return { status: 'healthy', stats };
  } catch (error) {
    return { status: 'unavailable' };
  }
}

// ==========================================
// MAIN HEALTH CHECK ENDPOINT
// ==========================================

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();

    // Parallel health checks
    const [dbHealth, redisHealth, cacheStats, rateLimitStats, queueStats] = await Promise.all([
      checkDatabaseConnection(),
      checkRedisConnection(),
      getCacheStats(),
      getRateLimitStats(),
      getQueueStats(),
    ]);

    const memoryUsage = getMemoryUsage();
    const cpuUsage = getCPUUsage();
    const totalResponseTime = Date.now() - startTime;

    // Determine overall health
    const overallStatus =
      dbHealth.status === 'healthy' && redisHealth.status === 'healthy'
        ? 'healthy'
        : dbHealth.status === 'unhealthy'
          ? 'critical'
          : 'degraded';

    // Prepare response
    const healthData = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      responseTime: totalResponseTime,
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV,

      // Component Status
      components: {
        database: {
          status: dbHealth.status,
          responseTime: dbHealth.responseTime,
        },
        redis: {
          status: redisHealth.status,
          stats: redisHealth.stats,
        },
        api: {
          status: 'healthy',
          uptime: cpuUsage.uptime,
        },
      },

      // System Metrics
      system: {
        memory: memoryUsage,
        cpu: cpuUsage,
        nodeVersion: process.version,
      },

      // Application Metrics
      application: {
        cache: cacheStats,
        rateLimit: rateLimitStats,
        queue: queueStats,
      },

      // Health Thresholds
      thresholds: {
        memoryHeapPercent: 85,
        currentHeapPercent: memoryUsage.heapUsagePercent,
        isMemoryHealthy: memoryUsage.heapUsagePercent < 85,
      },
    };

    // Set cache headers for load balancers
    const response = NextResponse.json(healthData, {
      status: overallStatus === 'critical' ? 503 : 200,
    });

    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('X-Health-Status', overallStatus);
    response.headers.set('X-Response-Time', `${totalResponseTime}ms`);

    return response;
  } catch (error) {
    console.error('[HEALTH] Endpoint error:', error);

    return NextResponse.json(
      {
        status: 'critical',
        error: 'Health check failed',
        timestamp: new Date().toISOString(),
      },
      {
        status: 503,
      }
    );
  }
}

// ==========================================
// LIVENESS PROBE (Quick check)
// ==========================================

export async function HEAD(request: NextRequest) {
  // Quick health check for load balancers
  try {
    await prisma.$queryRaw`SELECT 1`;
    return new NextResponse(null, { status: 200 });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}
