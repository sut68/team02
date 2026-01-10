/**
 * Separate Bull Queue Worker Process
 * Run this as a separate Node.js process for handling background jobs
 * 
 * Usage: node app/workers/queue-worker.js
 * Or with PM2: pm2 start app/workers/queue-worker.js --name bull-queue
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Queue = require('bull');

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

// ==========================================
// INITIALIZE QUEUES
// ==========================================

const emailQueue = new Queue('email', redisConfig);
const notificationQueue = new Queue('notification', redisConfig);
const exportQueue = new Queue('export', redisConfig);

console.log('[WORKER] Bull Queue worker started ✅');
console.log(`[WORKER] Redis: ${redisConfig.host}:${redisConfig.port}`);

// ==========================================
// EMAIL PROCESSOR
// ==========================================

emailQueue.process(async (job) => {
  const { to, subject, html, from = 'noreply@sut-alumniconnect.me' } = job.data;
  console.log(`[WORKER] Processing email to ${to}`);

  try {
    // TODO: Implement actual email sending with nodemailer
    // await sendEmail({ to, subject, html, from });

    job.progress(100);
    return { success: true, to, subject };
  } catch (error) {
    console.error(`[WORKER] Email sending failed:`, error);
    throw error;
  }
});

emailQueue.on('completed', (job) => {
  console.log(`[WORKER] Email job ${job.id} completed`);
});

emailQueue.on('failed', (job, err) => {
  console.error(`[WORKER] Email job ${job.id} failed:`, err.message);
});

// ==========================================
// NOTIFICATION PROCESSOR
// ==========================================

notificationQueue.process(async (job) => {
  const { userId, type, title, message, link } = job.data;
  console.log(`[WORKER] Processing notification for user ${userId}`);

  try {
    // TODO: Store notification in database
    // await prisma.notification.create({
    //   data: { userId, type, title, message, link }
    // });

    return { success: true, userId, type };
  } catch (error) {
    console.error(`[WORKER] Notification processing failed:`, error);
    throw error;
  }
});

notificationQueue.on('completed', (job) => {
  console.log(`[WORKER] Notification job ${job.id} completed`);
});

// ==========================================
// EXPORT PROCESSOR
// ==========================================

exportQueue.process(async (job) => {
  const { userId, type, filters } = job.data;
  console.log(`[WORKER] Processing export ${type} for user ${userId}`);

  try {
    job.progress(25);
    // TODO: Generate export file
    // const file = await generateExport(type, filters);

    job.progress(100);
    return { success: true, userId, type, jobId: job.id };
  } catch (error) {
    console.error(`[WORKER] Export generation failed:`, error);
    throw error;
  }
});

exportQueue.on('completed', (job) => {
  console.log(`[WORKER] Export job ${job.id} completed`);
});

// ==========================================
// GRACEFUL SHUTDOWN
// ==========================================

process.on('SIGTERM', async () => {
  console.log('[WORKER] Received SIGTERM, closing queues...');
  await emailQueue.close();
  await notificationQueue.close();
  await exportQueue.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[WORKER] Received SIGINT, closing queues...');
  await emailQueue.close();
  await notificationQueue.close();
  await exportQueue.close();
  process.exit(0);
});

// Keep worker running
process.on('uncaughtException', (error) => {
  console.error('[WORKER] Uncaught exception:', error);
  // Don't exit, let PM2/supervisor restart if needed
});
