import { z } from 'zod';

export const askSchema = z.object({
  question: z.string().min(1, 'سؤال الزامی است').max(1000, 'سؤال حداکثر ۱۰۰۰ کاراکتر'),
});
