import { z } from 'zod';

export const createCommentSchema = z.object({
  body: z.string().min(1, 'متن نظر الزامی است').max(2000, 'متن نظر حداکثر ۲۰۰۰ کاراکتر'),
});
