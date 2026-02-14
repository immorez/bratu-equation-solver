import { z } from "zod";

export const createDiscoveryJobSchema = z.object({
  need: z.string().optional(), // Procurement need driving product recommendations
  productCategories: z
    .array(z.string().min(1))
    .min(1, "At least one product category required"),
  targetCountries: z
    .array(z.string().min(1))
    .min(1, "At least one target country required"),
  maxVendorsPerQuery: z.number().int().min(1).max(50).default(10),
  autoImport: z.boolean().default(false),
  autoImportThreshold: z.number().min(0).max(1).default(0.8),
});

export const discoveryJobQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  status: z
    .enum(["PENDING", "RUNNING", "COMPLETED", "FAILED", "CANCELLED"])
    .optional(),
});

export const batchImportSchema = z.object({
  resultIds: z.array(z.string()).min(1, "At least one result ID required"),
});

export const skipResultSchema = z.object({
  reason: z.string().optional(),
});

export type CreateDiscoveryJobInput = z.infer<typeof createDiscoveryJobSchema>;
export type DiscoveryJobQuery = z.infer<typeof discoveryJobQuerySchema>;
