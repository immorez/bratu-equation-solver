export const MEETING_STATUS = {
  PLANNED: 'PLANNED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  ARCHIVED: 'ARCHIVED',
  CANCELLED: 'CANCELLED',
} as const;

export type MeetingStatusType = (typeof MEETING_STATUS)[keyof typeof MEETING_STATUS];
