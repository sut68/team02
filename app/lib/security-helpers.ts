/**
 * Security enhancements for authentication endpoints
 * Applied to login and register endpoints
 */

import { checkBruteForce, recordFailedAttempt, clearFailedAttempts, logSecurityEvent } from '@/app/lib/security';
import { NextRequest, NextResponse } from 'next/server';

export async function applySecurityChecks(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  return { ip };
}

export async function validateLoginSecurity(email: string, ip: string) {
  // Check brute force protection
  const bruteForceCheck = checkBruteForce(email);
  
  if (!bruteForceCheck.allowed) {
    logSecurityEvent('BRUTE_FORCE_DETECTED', `Failed login attempts for ${email}`, ip);
    return {
      allowed: false,
      message: 'Account is temporarily locked. Please try again in 15 minutes.',
    };
  }

  return { allowed: true };
}

export function recordLoginFailure(email: string, ip: string) {
  recordFailedAttempt(email);
  logSecurityEvent('LOGIN_FAILURE', `Failed login attempt for ${email}`, ip);
}

export function recordLoginSuccess(email: string, ip: string, userId: string) {
  clearFailedAttempts(email);
  logSecurityEvent('LOGIN_SUCCESS', `Successful login for ${email}`, ip, userId);
}

export function recordRegisterAttempt(email: string, ip: string, success: boolean) {
  if (success) {
    logSecurityEvent('REGISTRATION_SUCCESS', `New registration for ${email}`, ip);
  } else {
    logSecurityEvent('REGISTRATION_FAILURE', `Failed registration attempt for ${email}`, ip);
  }
}
