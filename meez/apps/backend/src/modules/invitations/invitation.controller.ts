import { Request, Response } from 'express';
import { invitationService } from './invitation.service';
import { sendSuccess } from '../../utils/response';

export class InvitationController {
  async send(req: Request, res: Response) {
    const invitations = await invitationService.send(req.params.meetingId, req.body.emails);
    sendSuccess(res, invitations, 201);
  }

  async rsvp(req: Request, res: Response) {
    const invitation = await invitationService.rsvp(req.params.token, req.body.status);
    sendSuccess(res, invitation);
  }

  async findByMeeting(req: Request, res: Response) {
    const invitations = await invitationService.findByMeeting(req.params.meetingId);
    sendSuccess(res, invitations);
  }
}

export const invitationController = new InvitationController();
