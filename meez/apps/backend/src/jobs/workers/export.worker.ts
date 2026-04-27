import { Worker, Job } from 'bullmq';
import { logger } from '../../utils/logger';

const exportWorker = new Worker(
  'exports',
  async (job: Job) => {
    const { meetingId, format } = job.data;
    logger.info({ meetingId, format }, 'Processing export');
    // Implement PDF/JSON export logic
  },
  { connection: { host: 'localhost', port: 6379 } },
);

exportWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'Export job failed');
});

export { exportWorker };
