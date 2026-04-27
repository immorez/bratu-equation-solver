import { insightsQueue, notificationQueue } from '../queue';
import { logger } from '../../utils/logger';

export async function processPostMeeting(meetingId: string, transcript: string) {
  logger.info({ meetingId }, 'Queueing post-meeting jobs');

  await insightsQueue.add('generate-insights', { meetingId, transcript });
  await notificationQueue.add('meeting-completed', {
    type: 'meeting_completed',
    meetingId,
  });
}
