import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';

import { env } from './config/env';
import { requestIdMiddleware } from './middleware/request-id.middleware';
import { rateLimitMiddleware } from './middleware/rate-limit.middleware';
import { errorHandler } from './middleware/error-handler.middleware';

import { authRoutes } from './modules/auth/auth.routes';
import { meetingRoutes } from './modules/meetings/meeting.routes';
import { documentRoutes } from './modules/documents/document.routes';
import { invitationRoutes } from './modules/invitations/invitation.routes';
import { insightsRoutes } from './modules/insights/insights.routes';
import { roomRoutes } from './modules/rooms/room.routes';

export function createApp() {
  const app = express();

  // Global Middleware
  app.use(requestIdMiddleware);
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGINS, credentials: true }));
  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(morgan('short'));
  app.use(rateLimitMiddleware);

  // Health Check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API Routes
  const prefix = env.API_PREFIX;
  app.use(`${prefix}/auth`, authRoutes);
  app.use(`${prefix}/meetings`, meetingRoutes);
  app.use(`${prefix}/documents`, documentRoutes);
  app.use(`${prefix}/invitations`, invitationRoutes);
  app.use(`${prefix}/insights`, insightsRoutes);
  app.use(`${prefix}/rooms`, roomRoutes);

  // Error Handler (must be last)
  app.use(errorHandler);

  return app;
}
