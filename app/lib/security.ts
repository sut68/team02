/**
 * Security utilities for comprehensive protection (Node.js Runtime)
 * For use in API routes and server-side code only
 */

import { NextRequest, NextResponse } from 'next/server';
import * as crypto from 'crypto';
import { logSecurityEvent as logSecurityEventEdge, createSafeErrorResponse as createSafeErrorResponseEdge } from '@/app/lib/security-edge';

// Re-export edge-safe functions
export const logSecurityEvent = logSecurityEventEdge;
export const createSafeErrorResponse = createSafeErrorResponseEdge;

// Re-export advanced security features
export {
  encryptSensitiveData,
  decryptSensitiveData,
  generateDeviceFingerprint,
  generateTOTPSecret,
  generateBackupCodes,
  validateTokenExpiry,
  validateTokenScope,
  SECURE_COOKIE_OPTIONS,
  validateApiKey,
  validateContentType,
  validateRequestSize,
  createAuditLog,
  getAuditLogs,
  hasPermission,
  validateRoleAccess,
  validateSecurityHeaders,
  sanitizeSQL,
  sanitizeJSON,
  isValidURL,
  performSecurityScan,
} from '@/app/lib/security-advanced';

// ==========================================
// 1. INPUT VALIDATION
// ==========================================

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain number' };
  }
  if (!/[!@#$%^&*]/.test(password)) {
    return { valid: false, error: 'Password must contain special character' };
  }
  return { valid: true };
}

export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone.replace(/[\s-]/g, ''));
}

export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>\"']/g, '') // Remove potentially dangerous characters
    .substring(0, 1000); // Limit length to prevent DoS
}

export function validateFileUpload(
  filename: string,
  size: number,
  maxSize: number = 10 * 1024 * 1024, // 10MB default
  allowedMimes: string[] = ['application/pdf', 'image/jpeg', 'image/png']
): { valid: boolean; error?: string } {
  // Check file size
  if (size > maxSize) {
    return { valid: false, error: 'File size exceeds maximum allowed' };
  }

  // Check filename for path traversal attempts
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return { valid: false, error: 'Invalid filename' };
  }

  // Check file extension against MIME types
  const ext = filename.split('.').pop()?.toLowerCase();
  const validExtensions = ['pdf', 'jpg', 'jpeg', 'png'];
  if (!ext || !validExtensions.includes(ext)) {
    return { valid: false, error: 'File type not allowed' };
  }

  return { valid: true };
}

// ==========================================
// 2. BRUTE FORCE PROTECTION
// ==========================================

interface BruteForceStore {
  [key: string]: {
    attempts: number;
    lockoutUntil: number;
  };
}

const bruteForceStore: BruteForceStore = {};
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

// Cleanup old entries every hour
setInterval(() => {
  const now = Date.now();
  Object.keys(bruteForceStore).forEach((key) => {
    if (bruteForceStore[key].lockoutUntil < now) {
      delete bruteForceStore[key];
    }
  });
}, 60 * 60 * 1000);

export function checkBruteForce(identifier: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const key = `brute_force_${identifier}`;

  if (!bruteForceStore[key]) {
    bruteForceStore[key] = { attempts: 0, lockoutUntil: 0 };
  }

  // Check if still locked out
  if (bruteForceStore[key].lockoutUntil > now) {
    return { allowed: false, remaining: 0 };
  }

  // Reset if lockout expired
  if (bruteForceStore[key].lockoutUntil <= now) {
    bruteForceStore[key].attempts = 0;
  }

  return { allowed: true, remaining: MAX_LOGIN_ATTEMPTS - bruteForceStore[key].attempts };
}

export function recordFailedAttempt(identifier: string): void {
  const key = `brute_force_${identifier}`;

  if (!bruteForceStore[key]) {
    bruteForceStore[key] = { attempts: 0, lockoutUntil: 0 };
  }

  bruteForceStore[key].attempts++;

  if (bruteForceStore[key].attempts >= MAX_LOGIN_ATTEMPTS) {
    bruteForceStore[key].lockoutUntil = Date.now() + LOCKOUT_DURATION;
  }
}

export function clearFailedAttempts(identifier: string): void {
  const key = `brute_force_${identifier}`;
  if (bruteForceStore[key]) {
    bruteForceStore[key].attempts = 0;
    bruteForceStore[key].lockoutUntil = 0;
  }
}

// ==========================================
// 3. CSRF TOKEN PROTECTION
// ==========================================

const csrfTokenStore: { [key: string]: { token: string; expiresAt: number } } = {};

export function generateCSRFToken(): string {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  csrfTokenStore[token] = { token, expiresAt };
  return token;
}

export function validateCSRFToken(token: string): boolean {
  if (!csrfTokenStore[token]) {
    return false;
  }

  if (csrfTokenStore[token].expiresAt < Date.now()) {
    delete csrfTokenStore[token];
    return false;
  }

  return true;
}

export function invalidateCSRFToken(token: string): void {
  delete csrfTokenStore[token];
}

// Cleanup expired CSRF tokens every hour
setInterval(() => {
  const now = Date.now();
  Object.keys(csrfTokenStore).forEach((key) => {
    if (csrfTokenStore[key].expiresAt < now) {
      delete csrfTokenStore[key];
    }
  });
}, 60 * 60 * 1000);
