import { prisma } from '../../config/db';
import { AppError } from '../../middleware/error-handler.middleware';
import { InvitationStatus } from '@prisma/client';

export class InvitationService {
  async send(meetingId: string, emails: string[]) {
    const invitations = await Promise.all(
      emails.map((email) =>
        prisma.invitation.create({
          data: { meetingId, email },
        }),
      ),
    );
    return invitations;
  }

  async rsvp(token: string, status: 'ACCEPTED' | 'DECLINED') {
    const invitation = await prisma.invitation.findUnique({ where: { token } });
    if (!invitation) throw new AppError('Invitation not found', 404, 'NOT_FOUND');
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new AppError('Invitation already responded', 400, 'APP_ERROR');
    }
    return prisma.invitation.update({
      where: { token },
      data: { status: status as InvitationStatus, respondedAt: new Date() },
    });
  }

  async findByMeeting(meetingId: string) {
    return prisma.invitation.findMany({ where: { meetingId } });
  }
}

export const invitationService = new InvitationService();
