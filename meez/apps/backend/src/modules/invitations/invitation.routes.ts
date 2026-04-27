import { Router } from 'express';
import { invitationController } from './invitation.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../utils/async-handler';
import { SendInvitationSchema, RsvpSchema } from '@meetai/shared';

export const invitationRoutes = Router();

invitationRoutes.post('/:meetingId/send', authenticate, validate(SendInvitationSchema), asyncHandler(invitationController.send));
invitationRoutes.get('/:meetingId', authenticate, asyncHandler(invitationController.findByMeeting));
invitationRoutes.post('/:token/rsvp', validate(RsvpSchema), asyncHandler(invitationController.rsvp));
