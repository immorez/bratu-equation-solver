export type MeetingStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED' | 'CANCELLED';

export interface Meeting {
  id: string;
  title: string;
  description?: string | null;
  startTime: string;
  endTime?: string | null;
  status: MeetingStatus;
  organizerId: string;
  orgId?: string | null;
  roomId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MeetingResponse extends Meeting {
  organizer: { id: string; email: string };
  participants: Participant[];
  transcript?: TranscriptSummary | null;
}

export interface Participant {
  id: string;
  userId: string;
  meetingId: string;
  joinedAt?: string | null;
  leftAt?: string | null;
}

export interface TranscriptSummary {
  id: string;
  meetingId: string;
  hasInsights: boolean;
}

export interface CreateMeetingInput {
  title: string;
  description?: string;
  startTime: string;
  endTime?: string;
}

export interface UpdateMeetingInput {
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  status?: MeetingStatus;
}
