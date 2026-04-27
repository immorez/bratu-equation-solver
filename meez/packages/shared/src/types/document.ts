export interface Document {
  id: string;
  meetingId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  summary?: string | null;
  uploadedBy: string;
  createdAt: string;
}
