import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.js";
import { AppError } from "../middleware/error-handler.js";
import {
  createVendorSchema,
  vendorQuerySchema,
} from "../schemas/vendor.schema.js";
import type { Prisma } from "@prisma/client";

export const vendorRouter = Router();
vendorRouter.use(authenticate);

// ─── List vendors ────────────────────────────────────────────
vendorRouter.get("/", async (req, res) => {
  const query = vendorQuerySchema.parse(req.query);
  const { page, limit, status, country, search, sortBy, sortOrder } = query;

  const where: Prisma.VendorWhereInput = {
    ...(status && { status }),
    ...(country && { country: { contains: country, mode: "insensitive" as const } }),
    ...(search && {
      OR: [
        { companyName: { contains: search, mode: "insensitive" as const } },
        { country: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [vendors, total] = await Promise.all([
    prisma.vendor.findMany({
      where,
      include: {
        contacts: true,
        certifications: true,
        products: true,
        _count: { select: { quotes: true, communications: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.vendor.count({ where }),
  ]);

  res.json({
    data: vendors,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// ─── Get single vendor ──────────────────────────────────────
vendorRouter.get("/:id", async (req, res) => {
  const vendor = await prisma.vendor.findUnique({
    where: { id: req.params.id },
    include: {
      contacts: true,
      certifications: true,
      products: true,
      communications: { orderBy: { sentAt: "desc" }, take: 20 },
      quotes: { include: { rfq: true }, orderBy: { receivedAt: "desc" } },
    },
  });
  if (!vendor) throw new AppError(404, "Vendor not found");
  res.json(vendor);
});

// ─── Create vendor ──────────────────────────────────────────
vendorRouter.post("/", async (req, res) => {
  const data = createVendorSchema.parse(req.body);
  const { contacts, certifications, products, ...vendorData } = data;

  const vendor = await prisma.vendor.create({
    data: {
      ...vendorData,
      contacts: contacts ? { createMany: { data: contacts } } : undefined,
      certifications: certifications
        ? {
            createMany: {
              data: certifications.map((c) => ({
                ...c,
                validUntil: c.validUntil ? new Date(c.validUntil) : undefined,
              })),
            },
          }
        : undefined,
      products: products
        ? {
            createMany: {
              data: products.map((p) => ({
                ...p,
                specifications: p.specifications
                  ? (p.specifications as Record<string, string>)
                  : undefined,
                priceRange: p.priceRange
                  ? (p.priceRange as unknown as Record<string, number>)
                  : undefined,
              })),
            },
          }
        : undefined,
    },
    include: { contacts: true, certifications: true, products: true },
  });

  res.status(201).json(vendor);
});

// ─── Update vendor ──────────────────────────────────────────
vendorRouter.patch("/:id", async (req, res) => {
  const existing = await prisma.vendor.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new AppError(404, "Vendor not found");

  const vendor = await prisma.vendor.update({
    where: { id: req.params.id },
    data: req.body,
    include: { contacts: true, certifications: true, products: true },
  });

  res.json(vendor);
});

// ─── Delete vendor ──────────────────────────────────────────
vendorRouter.delete("/:id", async (req, res) => {
  const existing = await prisma.vendor.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new AppError(404, "Vendor not found");

  await prisma.vendor.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
