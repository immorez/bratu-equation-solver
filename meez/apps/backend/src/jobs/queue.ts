import { Queue, Worker } from 'bullmq';
import { redis } from '../config/redis';
import { logger } from '../utils/logger';

const connection = { host: 'localhost', port: 6379 };

export const insightsQueue = new Queue('insights', { connection });
export const notificationQueue = new Queue('notifications', { connection });
export const exportQueue = new Queue('exports', { connection });

logger.info('BullMQ queues initialized');
