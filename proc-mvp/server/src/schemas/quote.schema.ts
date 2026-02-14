import { z } from "zod";

export const createQuoteSchema = z.object({
  rfqId: z.string().uuid(),
  vendorId: z.string().uuid(),
  unitPrice: z.number().positive(),
  totalPrice: z.number().positive(),
  currency: z.string().default("USD"),
  leadTimeDays: z.number().int().positive(),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
  validUntil: z.string().datetime().optional(),
});

export const updateQuoteStatusSchema = z.object({
  status: z.enum(["RECEIVED", "UNDER_REVIEW", "NEGOTIATING", "ACCEPTED", "REJECTED"]),
});

export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;
export type UpdateQuoteStatusInput = z.infer<typeof updateQuoteStatusSchema>;
