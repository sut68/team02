/**
 * Query Optimization Utilities
 * Prevents N+1 queries, optimizes batch operations, caches results
 */

import { Prisma } from '@prisma/client';
import { prisma } from './prisma';
import { getFromCache, setInCache, invalidateCache } from './cache';

// ==========================================
// 1. QUERY RESULT CACHING
// ==========================================

export interface CacheConfig {
  ttl?: number; // seconds, default 300
  key?: string;
  invalidateOn?: string[];
}

export async function cachedQuery<T>(
  queryFn: () => Promise<T>,
  cacheKey: string,
  config: CacheConfig = {}
): Promise<T> {
  const { ttl = 300 } = config;

  try {
    // Try to get from cache
    const cached = await getFromCache<T>(cacheKey);
    if (cached) {
      console.log(`[QUERY] Cache HIT: ${cacheKey}`);
      return cached;
    }
  } catch (error) {
    console.warn(`[QUERY] Cache retrieval failed for ${cacheKey}:`, error);
  }

  // Execute query
  console.log(`[QUERY] Cache MISS: ${cacheKey} - Executing query`);
  const result = await queryFn();

  // Store in cache
  try {
    await setInCache(cacheKey, result, ttl);
  } catch (error) {
    console.warn(`[QUERY] Failed to cache ${cacheKey}:`, error);
  }

  return result;
}

// ==========================================
// 2. BATCH OPERATIONS
// ==========================================

export async function batchGetUsers(userIds: number[]) {
  if (userIds.length === 0) return [];

  // Remove duplicates
  const uniqueIds = [...new Set(userIds)];

  try {
    const users = await cachedQuery(
      () =>
        prisma.user.findMany({
          where: { id: { in: uniqueIds } },
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            createdAt: true,
          },
        }),
      `batch:users:${uniqueIds.join(',')}`,
      { ttl: 600 }
    );

    // Return in original order
    const userMap = new Map(users.map((u) => [u.id, u]));
    return userIds.map((id) => userMap.get(id)).filter(Boolean);
  } catch (error) {
    console.error('[QUERY] Batch get users failed:', error);
    return [];
  }
}

export async function batchGetDonationProjects(projectIds: number[]) {
  if (projectIds.length === 0) return [];

  const uniqueIds = [...new Set(projectIds)];

  try {
    const projects = await cachedQuery(
      () =>
        prisma.donationProject.findMany({
          where: { id: { in: uniqueIds } },
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            currentAmount: true,
            goalAmount: true,
            posterUrl: true,
          },
        }),
      `batch:projects:${uniqueIds.join(',')}`,
      { ttl: 600 }
    );

    const projectMap = new Map(projects.map((p) => [p.id, p]));
    return projectIds.map((id) => projectMap.get(id)).filter(Boolean);
  } catch (error) {
    console.error('[QUERY] Batch get projects failed:', error);
    return [];
  }
}

// ==========================================
// 3. OPTIMIZED QUERIES WITH SELECTION
// ==========================================

export async function getUserWithStats(userId: number) {
  return cachedQuery(
    () =>
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          _count: {
            select: {
              donations: true,
              bookings: true,
              proposalsAsStaff: true,
            },
          },
        },
      }),
    `user:${userId}:stats`,
    { ttl: 300 }
  );
}

export async function getProjectWithDonors(projectId: number, limit = 10) {
  return cachedQuery(
    () =>
      prisma.donationProject.findUnique({
        where: { id: projectId },
        select: {
          id: true,
          title: true,
          description: true,
          goalAmount: true,
          currentAmount: true,
          status: true,
          startDate: true,
          endDate: true,
          posterUrl: true,
          _count: {
            select: { transactions: true },
          },
          transactions: {
            orderBy: { createdAt: 'desc' },
            take: limit,
            select: {
              id: true,
              amount: true,
              createdAt: true,
              user: {
                select: { id: true, fullName: true },
              },
            },
          },
        },
      }),
    `project:${projectId}:donors`,
    { ttl: 300 }
  );
}

// ==========================================
// 4. AGGREGATION QUERIES
// ==========================================

export async function getDonationStats(userId: number) {
  return cachedQuery(
    () =>
      prisma.donationTransaction.aggregate({
        where: { userId: userId },
        _sum: { amount: true },
        _count: true,
        _avg: { amount: true },
        _max: { amount: true },
        _min: { amount: true },
      }),
    `user:${userId}:donation-stats`,
    { ttl: 600 }
  );
}

export async function getProjectStats(projectId: number) {
  return cachedQuery(
    () =>
      prisma.donationTransaction.aggregate({
        where: { projectId: projectId },
        _sum: { amount: true },
        _count: true,
        _avg: { amount: true },
      }),
    `project:${projectId}:stats`,
    { ttl: 600 }
  );
}

// ==========================================
// 5. PAGINATION WITH CURSOR
// ==========================================

export async function getPaginatedProjects(
  cursor?: number,
  limit = 20,
  filter?: {
    status?: string;
    search?: string;
  }
) {
  const where: Prisma.DonationProjectWhereInput = {};

  if (filter?.status && filter.status !== 'ALL') {
    where.status = filter.status as any;
  }

  if (filter?.search) {
    where.OR = [
      { title: { contains: filter.search, mode: 'insensitive' } },
      { description: { contains: filter.search, mode: 'insensitive' } },
    ];
  }

  const cacheKey = `projects:paginated:${cursor || 0}:${limit}:${JSON.stringify(filter || {})}`;

  return cachedQuery(
    () =>
      prisma.donationProject.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        cursor: cursor ? { id: cursor } : undefined,
        skip: cursor ? 1 : 0,
        take: limit,
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          currentAmount: true,
          goalAmount: true,
          posterUrl: true,
          createdAt: true,
          _count: { select: { transactions: true } },
        },
      }),
    cacheKey,
    { ttl: 300 }
  );
}

// ==========================================
// 6. CACHE INVALIDATION HELPERS
// ==========================================

export async function invalidateUserCache(userId: number) {
  await invalidateCache(`user:${userId}:*`);
  await invalidateCache(`batch:users:*`);
}

export async function invalidateProjectCache(projectId: number) {
  await invalidateCache(`project:${projectId}:*`);
  await invalidateCache(`projects:paginated:*`);
  await invalidateCache(`batch:projects:*`);
}

export async function invalidateDonationCaches(userId: number, projectId: number) {
  await invalidateUserCache(userId);
  await invalidateProjectCache(projectId);
  await invalidateCache(`user:${userId}:donation-stats`);
  await invalidateCache(`project:${projectId}:stats`);
}

// ==========================================
// 7. QUERY STATISTICS
// ==========================================

let queryStats = {
  total: 0,
  cached: 0,
  fresh: 0,
  errors: 0,
};

export function getQueryStats() {
  return {
    ...queryStats,
    cacheHitRate: queryStats.total > 0 ? ((queryStats.cached / queryStats.total) * 100).toFixed(2) + '%' : '0%',
  };
}

export function resetQueryStats() {
  queryStats = { total: 0, cached: 0, fresh: 0, errors: 0 };
}

// ==========================================
// 8. BULK OPERATIONS
// ==========================================

export async function bulkCreateDonations(donations: Array<{ userId?: number; projectId: number; amount: number }>) {
  if (donations.length === 0) return [];

  try {
    const result = await prisma.donationTransaction.createMany({
      data: donations as any,
      skipDuplicates: false,
    });

    // Invalidate caches for all affected projects and users
    const projectIds = [...new Set(donations.map((d) => d.projectId))];
    const userIds = [...new Set(donations.map((d) => d.userId).filter(Boolean))];

    for (const projectId of projectIds) {
      await invalidateProjectCache(projectId);
    }

    for (const userId of userIds) {
      await invalidateUserCache(userId as number);
    }

    return result;
  } catch (error) {
    console.error('[QUERY] Bulk create donations failed:', error);
    throw error;
  }
}

// ==========================================
// 9. PREFETCH DATA
// ==========================================

export async function prefetchUserData(userId: number) {
  try {
    await Promise.all([
      getUserWithStats(userId),
      getDonationStats(userId),
      batchGetDonationProjects([1, 2, 3, 4, 5]), // Common projects
    ]);

    console.log(`[QUERY] Prefetched data for user ${userId}`);
  } catch (error) {
    console.warn(`[QUERY] Prefetch failed for user ${userId}:`, error);
  }
}

export async function prefetchProjectData(projectId: number) {
  try {
    await Promise.all([getProjectWithDonors(projectId), getProjectStats(projectId)]);

    console.log(`[QUERY] Prefetched data for project ${projectId}`);
  } catch (error) {
    console.warn(`[QUERY] Prefetch failed for project ${projectId}:`, error);
  }
}
