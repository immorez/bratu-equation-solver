import { Worker, Job } from 'bullmq';
import { getInsightsProvider } from '../../providers/ai';
import { prisma } from '../../config/db';
import { logger } from '../../utils/logger';

const insightsWorker = new Worker(
  'insights',
  async (job: Job) => {
    const { meetingId, transcript } = job.data;
    logger.info({ meetingId }, 'Processing insights job');

    const provider = getInsightsProvider();
    const insights = await provider.generateInsights(transcript);

    await prisma.transcript.update({
      where: { meetingId },
      data: { insights: insights as any },
    });

    logger.info({ meetingId }, 'Insights job completed');
    return insights;
  },
  { connection: { host: 'localhost', port: 6379 } },
);

insightsWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'Insights job failed');
});

export { insightsWorker };
