import { prisma } from '../../config/db';
import { AppError } from '../../middleware/error-handler.middleware';

export class InsightsService {
  async getByMeeting(meetingId: string) {
    const transcript = await prisma.transcript.findUnique({ where: { meetingId } });
    if (!transcript) throw new AppError('Transcript not found', 404, 'NOT_FOUND');
    return transcript.insights;
  }
}

export const insightsService = new InsightsService();
