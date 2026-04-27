import { z } from 'zod';

export const CreateMeetingSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().max(2000).optional(),
  startTime: z.string().datetime({ message: 'Invalid datetime format' }),
  endTime: z.string().datetime().optional(),
});

export const UpdateMeetingSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().max(2000).optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  status: z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED', 'CANCELLED']).optional(),
});

export const MeetingQuerySchema = z.object({
  status: z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED', 'CANCELLED']).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateMeetingInput = z.infer<typeof CreateMeetingSchema>;
export type UpdateMeetingInput = z.infer<typeof UpdateMeetingSchema>;
export type MeetingQuery = z.infer<typeof MeetingQuerySchema>;
