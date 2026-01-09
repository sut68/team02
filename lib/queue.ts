// lib/queue.ts
import { Queue, Worker } from 'bullmq';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const connection = { url: redisUrl };

export const emailQueue = new Queue('email', { connection });

// Example: Add email job
export async function addEmailJob(data: { to: string; subject: string; body: string }) {
  await emailQueue.add('sendEmail', data);
}

// Example: Worker to process email jobs
export function startEmailWorker() {
  const worker = new Worker('email', async job => {
    // TODO: Implement actual email sending logic here
    console.log('Sending email:', job.data);
    // await sendEmail(job.data);
  }, { connection });
  return worker;
}
