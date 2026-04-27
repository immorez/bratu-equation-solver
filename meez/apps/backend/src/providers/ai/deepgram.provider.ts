import { TranscriptionProvider, TranscriptChunkResult } from './ai.provider.interface';
import { logger } from '../../utils/logger';

export class DeepgramProvider implements TranscriptionProvider {
  name = 'deepgram';
  private activeStreams = new Map<string, boolean>();

  async initStream(meetingId: string): Promise<void> {
    this.activeStreams.set(meetingId, true);
    logger.info({ meetingId }, 'Deepgram stream initialized');
  }

  async processChunk(audioData: Buffer | string, speakerHint?: string): Promise<TranscriptChunkResult> {
    // In production, integrate with @deepgram/sdk
    // This is a placeholder that returns a mock result
    return {
      speaker: speakerHint || 'Unknown',
      text: '[Deepgram transcription - connect API key to enable]',
      timestamp: Date.now() / 1000,
      confidence: 0.95,
    };
  }

  async endStream(meetingId: string): Promise<void> {
    this.activeStreams.delete(meetingId);
    logger.info({ meetingId }, 'Deepgram stream ended');
  }
}
