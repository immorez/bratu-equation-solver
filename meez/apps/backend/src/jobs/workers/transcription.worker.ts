import { Worker, Job } from 'bullmq';
import { getTranscriptionProvider } from '../../providers/ai';
import { logger } from '../../utils/logger';

const transcriptionWorker = new Worker(
  'transcription',
  async (job: Job) => {
    const { meetingId, audioUrl } = job.data;
    logger.info({ meetingId }, 'Processing transcription job');
    // Implement batch transcription for uploaded recordings
  },
  { connection: { host: 'localhost', port: 6379 } },
);

transcriptionWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'Transcription job failed');
});

export { transcriptionWorker };
