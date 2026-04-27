export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';

export interface Invitation {
  id: string;
  meetingId: string;
  email: string;
  token: string;
  status: InvitationStatus;
  respondedAt?: string | null;
  createdAt: string;
}
