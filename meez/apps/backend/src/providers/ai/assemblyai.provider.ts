import { TranscriptionProvider, TranscriptChunkResult } from './ai.provider.interface';

export class AssemblyAIProvider implements TranscriptionProvider {
  name = 'assemblyai';

  async initStream(_meetingId: string): Promise<void> {
    throw new Error('AssemblyAI provider not yet implemented');
  }

  async processChunk(_audioData: Buffer | string, _speakerHint?: string): Promise<TranscriptChunkResult> {
    throw new Error('AssemblyAI provider not yet implemented');
  }

  async endStream(_meetingId: string): Promise<void> {
    throw new Error('AssemblyAI provider not yet implemented');
  }
}
