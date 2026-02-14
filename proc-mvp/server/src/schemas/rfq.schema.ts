import { z } from "zod";

export const createRfqSchema = z.object({
  deliveryLocation: z.string().min(1),
  requiredDeliveryDate: z.string().datetime().optional(),
  budgetMin: z.number().positive().optional(),
  budgetMax: z.number().positive().optional(),
  budgetCurrency: z.string().default("USD"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  qualityRequirements: z.array(z.string()).default([]),
  paymentTermsPreference: z.string().optional(),
  notes: z.string().optional(),
  lineItems: z
    .array(
      z.object({
        productName: z.string().min(1),
        specifications: z.record(z.string(), z.string()).optional(),
        quantity: z.number().int().positive(),
        unit: z.string().default("pieces"),
      }),
    )
    .min(1, "At least one line item is required"),
});

export const rfqQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z
    .enum(["DRAFT", "SENT", "QUOTING", "NEGOTIATING", "COMPARING", "COMPLETED", "CANCELLED"])
    .optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  sortBy: z.enum(["rfqNumber", "createdAt", "status"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateRfqInput = z.infer<typeof createRfqSchema>;
export type RfqQuery = z.infer<typeof rfqQuerySchema>;
