import { createServer } from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { redis } from './config/redis';
import { prisma } from './config/db';
import { initSocketServer } from './config/socket';

async function bootstrap() {
  await redis.connect();
  await prisma.$connect();
  logger.info('Database connected');

  const app = createApp();
  const httpServer = createServer(app);

  initSocketServer(httpServer);

  httpServer.listen(env.PORT, () => {
    logger.info(`MeetAI Backend running on port ${env.PORT}`);
    logger.info(`Environment: ${env.NODE_ENV}`);
    logger.info(`API Prefix: ${env.API_PREFIX}`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    httpServer.close();
    await prisma.$disconnect();
    await redis.quit();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
