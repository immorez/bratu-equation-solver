import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(1, 'نام الزامی است').max(255),
  email: z.string().email('ایمیل نامعتبر است'),
  password: z.string().min(6, 'رمز عبور حداقل ۶ کاراکتر'),
  role: z.enum(['employee', 'manager']).default('employee'),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  role: z.enum(['employee', 'manager']).optional(),
  active: z.boolean().optional(),
});
