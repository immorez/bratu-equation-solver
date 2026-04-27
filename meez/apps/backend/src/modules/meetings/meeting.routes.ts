import { Router } from 'express';
import { meetingController } from './meeting.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../utils/async-handler';
import { CreateMeetingSchema, UpdateMeetingSchema, MeetingQuerySchema } from '@meetai/shared';

export const meetingRoutes = Router();

meetingRoutes.use(authenticate);

meetingRoutes.post('/', validate(CreateMeetingSchema), asyncHandler(meetingController.create));
meetingRoutes.get('/', validate(MeetingQuerySchema, 'query'), asyncHandler(meetingController.findAll));
meetingRoutes.get('/:id', asyncHandler(meetingController.findById));
meetingRoutes.put('/:id', validate(UpdateMeetingSchema), asyncHandler(meetingController.update));
meetingRoutes.delete('/:id', asyncHandler(meetingController.delete));
