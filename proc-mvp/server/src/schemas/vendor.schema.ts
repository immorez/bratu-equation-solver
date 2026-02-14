import { z } from "zod";

export const createVendorSchema = z.object({
  companyName: z.string().min(1),
  country: z.string().min(1),
  website: z.string().url().optional(),
  address: z.string().optional(),
  companySize: z.string().optional(),
  yearsInBusiness: z.number().int().positive().optional(),
  manufacturingCapacity: z.string().optional(),
  minimumOrderQuantity: z.string().optional(),
  leadTime: z.string().optional(),
  contacts: z
    .array(
      z.object({
        type: z.enum(["email", "phone"]),
        value: z.string(),
      }),
    )
    .optional(),
  certifications: z
    .array(
      z.object({
        name: z.string(),
        issuedBy: z.string().optional(),
        validUntil: z.string().datetime().optional(),
      }),
    )
    .optional(),
  products: z
    .array(
      z.object({
        productCategory: z.string(),
        specifications: z.record(z.string(), z.string()).optional(),
        priceRange: z
          .object({ min: z.number().optional(), max: z.number().optional() })
          .optional(),
        moq: z.number().int().optional(),
      }),
    )
    .optional(),
});

export const vendorQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(["DISCOVERED", "CONTACTED", "ACTIVE", "INACTIVE"]).optional(),
  country: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(["companyName", "performanceScore", "createdAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateVendorInput = z.infer<typeof createVendorSchema>;
export type VendorQuery = z.infer<typeof vendorQuerySchema>;
