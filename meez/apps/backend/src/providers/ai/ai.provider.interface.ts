export interface TranscriptChunkResult {
  speaker: string;
  text: string;
  timestamp: number;
  confidence: number;
}

export interface TranscriptionProvider {
  name: string;
  initStream(meetingId: string): Promise<void>;
  processChunk(audioData: Buffer | string, speakerHint?: string): Promise<TranscriptChunkResult>;
  endStream(meetingId: string): Promise<void>;
}

export interface InsightsProvider {
  generateInsights(fullTranscript: string): Promise<{
    notes: string[];
    tasks: { description: string; assignee?: string; due?: string }[];
    topics: string[];
    sentiment: number;
  }>;
  generateSummary(text: string): Promise<string>;
  generateFollowUpAgenda(transcript: string, previousAgenda?: string): Promise<string>;
}
