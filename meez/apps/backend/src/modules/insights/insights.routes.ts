import { Router } from 'express';
import { insightsController } from './insights.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../utils/async-handler';

export const insightsRoutes = Router();
insightsRoutes.use(authenticate);

insightsRoutes.get('/:meetingId', asyncHandler(insightsController.getByMeeting));
