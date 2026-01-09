/**
 * Message Queue System (Stub)
 * Bull Queue requires Node.js and should be imported only at runtime
 * This stub provides type definitions and graceful fallback
 * 
 * For production use, run a separate Bull Queue worker process:
 * - Create app/workers/queue-worker.js
 * - Run with: node app/workers/queue-worker.js
 */

export interface EmailJob {
  to: string;
  subject: string;
  html: string;
  from?: string;
  retries?: number;
}

export interface NotificationJob {
  userId: number;
  type: 'donation' | 'project' | 'message' | 'system';
  title: string;
  message: string;
  link?: string;
}

export interface ExportJob {
  userId: number;
  type: 'donations' | 'donations-csv' | 'report-pdf';
  filters?: Record<string, any>;
}

// Graceful stubs - in production, connect to external Bull Queue worker
export async function addEmailJob(data: EmailJob): Promise<boolean> {
  console.warn('[QUEUE] Email queue stub called - set up Bull Queue worker in production');
  // In production, send HTTP request to Bull Queue worker endpoint
  // await fetch('http://queue-worker:3001/api/queue/email', { method: 'POST', body: JSON.stringify(data) });
  return true;
}

export async function addNotificationJob(data: NotificationJob): Promise<boolean> {
  console.warn('[QUEUE] Notification queue stub called - set up Bull Queue worker in production');
  return true;
}

export async function addExportJob(data: ExportJob): Promise<boolean> {
  console.warn('[QUEUE] Export queue stub called - set up Bull Queue worker in production');
  return true;
}

export async function getQueueStats(): Promise<{
  email: { waiting: number; active: number; completed: number; failed: number };
  notification: { waiting: number; active: number; completed: number; failed: number };
  export: { waiting: number; active: number; completed: number; failed: number };
}> {
  return {
    email: { waiting: 0, active: 0, completed: 0, failed: 0 },
    notification: { waiting: 0, active: 0, completed: 0, failed: 0 },
    export: { waiting: 0, active: 0, completed: 0, failed: 0 },
  };
}

export const emailQueue = null;
export const notificationQueue = null;
export const exportQueue = null;
