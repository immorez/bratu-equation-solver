import { z } from 'zod';

export const createRequestSchema = z.object({
  title: z.string().min(1, 'عنوان الزامی است').max(500, 'عنوان حداکثر ۵۰۰ کاراکتر'),
  description: z.string().min(1, 'توضیحات الزامی است').max(5000, 'توضیحات حداکثر ۵۰۰۰ کاراکتر'),
  amount: z.number().positive('مبلغ باید مثبت باشد').optional().nullable(),
});

export const updateRequestSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().min(1).max(5000).optional(),
  amount: z.number().positive().optional().nullable(),
});

export const workflowCommentSchema = z.object({
  comment: z.string().max(2000, 'نظر حداکثر ۲۰۰۰ کاراکتر').optional(),
});

export const listRequestsQuery = z.object({
  status: z.string().optional(),
  employeeId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
