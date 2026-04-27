import { Worker, Job } from 'bullmq';
import { logger } from '../../utils/logger';

const notificationWorker = new Worker(
  'notifications',
  async (job: Job) => {
    const { type, to, data } = job.data;
    logger.info({ type, to }, 'Processing notification');
    // Implement email/push notification logic
  },
  { connection: { host: 'localhost', port: 6379 } },
);

notificationWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'Notification job failed');
});

export { notificationWorker };
