/**
 * Security utilities for Edge Runtime (middleware)
 * No Node.js modules - only browser/Web APIs
 */

import { NextResponse } from 'next/server';

// ==========================================
// EDGE-SAFE SECURITY LOGGING (memory only)
// ==========================================

interface SecurityLog {
  timestamp: Date;
  type: string;
  userId?: string;
  ip: string;
  action: string;
  details?: Record<string, any>;
}

const securityLogs: SecurityLog[] = [];

export function logSecurityEvent(
  type: string,
  action: string,
  ip: string,
  userId?: string,
  details?: Record<string, any>
): void {
  const log: SecurityLog = {
    timestamp: new Date(),
    type,
    userId,
    ip,
    action,
    details,
  };

  securityLogs.push(log);

  // Keep only last 1000 logs in memory
  if (securityLogs.length > 1000) {
    securityLogs.shift();
  }

  // Log to console only in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[SECURITY] ${type}: ${action}`);
  }
}

export function getSecurityLogs(filter?: { type?: string; userId?: string }): SecurityLog[] {
  return securityLogs.filter((log) => {
    if (filter?.type && log.type !== filter.type) return false;
    if (filter?.userId && log.userId !== filter.userId) return false;
    return true;
  });
}

// ==========================================
// SAFE ERROR HANDLING
// ==========================================

export function createSafeErrorResponse(
  statusCode: number,
  publicMessage: string,
  internalMessage?: string
): NextResponse {
  // Log internal message only in development
  if (process.env.NODE_ENV === 'development' && internalMessage) {
    console.error(`[Internal Error] ${internalMessage}`);
  }

  return NextResponse.json(
    { error: publicMessage },
    { status: statusCode }
  );
}
