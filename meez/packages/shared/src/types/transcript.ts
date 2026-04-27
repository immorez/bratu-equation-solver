export interface TranscriptChunk {
  speaker: string;
  text: string;
  timestamp: number;
  confidence: number;
}

export interface Insights {
  notes: string[];
  tasks: InsightTask[];
  topics: string[];
  sentiment: number;
}

export interface InsightTask {
  description: string;
  assignee?: string;
  due?: string;
}

export interface Transcript {
  id: string;
  meetingId: string;
  chunks: TranscriptChunk[];
  insights?: Insights | null;
  createdAt: string;
  updatedAt: string;
}
