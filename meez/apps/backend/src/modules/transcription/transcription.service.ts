import { prisma } from '../../config/db';
import { redis } from '../../config/redis';
import { logger } from '../../utils/logger';
import { MeetingStatus } from '@prisma/client';

class TranscriptionService {
  async startStream(meetingId: string) {
    await prisma.meeting.update({
      where: { id: meetingId },
      data: { status: MeetingStatus.IN_PROGRESS },
    });

    await prisma.transcript.upsert({
      where: { meetingId },
      create: { meetingId, chunks: [] },
      update: {},
    });

    await redis.set(`meeting:${meetingId}:recording`, 'true', 'EX', 14400);
  }

  async processAudioChunk(meetingId: string, chunk: Buffer | string, speakerEmail: string) {
    // In production, this would use Deepgram/AssemblyAI
    const chunkData = {
      speaker: speakerEmail,
      text: '[Transcription placeholder - connect AI provider]',
      timestamp: Date.now() / 1000,
      confidence: 0.95,
    };

    await redis.rpush(`meeting:${meetingId}:chunks`, JSON.stringify(chunkData));
    await redis.expire(`meeting:${meetingId}:chunks`, 86400);

    return chunkData;
  }

  async stopAndProcess(meetingId: string) {
    await redis.del(`meeting:${meetingId}:recording`);

    await prisma.meeting.update({
      where: { id: meetingId },
      data: { status: MeetingStatus.COMPLETED, endTime: new Date() },
    });

    const transcript = await prisma.transcript.findUnique({ where: { meetingId } });
    if (!transcript) return null;

    // In production, would call OpenAI for insights
    const insights = {
      notes: ['Meeting transcription completed'],
      tasks: [],
      topics: ['General Discussion'],
      sentiment: 0.5,
    };

    await prisma.transcript.update({
      where: { meetingId },
      data: { insights: insights as any },
    });

    logger.info({ meetingId }, 'Insights generated');
    return insights;
  }

  async getTranscript(meetingId: string) {
    return prisma.transcript.findUnique({ where: { meetingId } });
  }
}

export const transcriptionService = new TranscriptionService();
