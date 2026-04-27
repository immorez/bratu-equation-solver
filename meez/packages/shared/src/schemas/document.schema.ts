import { z } from 'zod';

export const UploadDocumentSchema = z.object({
  meetingId: z.string().uuid(),
});

export const DocumentQuerySchema = z.object({
  meetingId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type UploadDocumentInput = z.infer<typeof UploadDocumentSchema>;
export type DocumentQuery = z.infer<typeof DocumentQuerySchema>;
