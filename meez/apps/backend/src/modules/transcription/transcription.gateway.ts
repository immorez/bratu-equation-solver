import { Server, Socket } from 'socket.io';
import { AuthPayload } from '../../middleware/auth.middleware';
import { transcriptionService } from './transcription.service';
import { logger } from '../../utils/logger';

class TranscriptionGateway {
  register(io: Server, socket: Socket, user: AuthPayload) {
    socket.on('audio-chunk', async (data: { meetingId: string; chunk: Buffer | string }) => {
      try {
        const { meetingId, chunk } = data;
        const result = await transcriptionService.processAudioChunk(meetingId, chunk, user.email);
        io.to(`meeting:${meetingId}`).emit('transcript-chunk', {
          speaker: result.speaker,
          text: result.text,
          timestamp: result.timestamp,
          confidence: result.confidence,
        });
      } catch (err) {
        logger.error({ err, userId: user.userId }, 'Audio chunk processing failed');
        socket.emit('transcription-error', { message: 'Failed to process audio chunk' });
      }
    });

    socket.on('start-transcription', async (data: { meetingId: string }) => {
      try {
        await transcriptionService.startStream(data.meetingId);
        socket.emit('transcription-started', { meetingId: data.meetingId });
      } catch (err) {
        logger.error({ err }, 'Failed to start transcription');
        socket.emit('transcription-error', { message: 'Failed to start transcription' });
      }
    });

    socket.on('stop-transcription', async (data: { meetingId: string }) => {
      try {
        const insights = await transcriptionService.stopAndProcess(data.meetingId);
        io.to(`meeting:${data.meetingId}`).emit('transcription-stopped', { meetingId: data.meetingId, insights });
      } catch (err) {
        logger.error({ err }, 'Failed to stop transcription');
      }
    });
  }
}

export const transcriptionGateway = new TranscriptionGateway();
