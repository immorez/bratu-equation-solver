import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.js";
import { AppError } from "../middleware/error-handler.js";
import { createRfqSchema, rfqQuerySchema } from "../schemas/rfq.schema.js";
import type { Prisma } from "@prisma/client";

export const rfqRouter = Router();
rfqRouter.use(authenticate);

// ─── List RFQs ───────────────────────────────────────────────
rfqRouter.get("/", async (req, res) => {
  const query = rfqQuerySchema.parse(req.query);
  const { page, limit, status, priority, sortBy, sortOrder } = query;

  const where: Prisma.RfqWhereInput = {
    ...(status && { status }),
    ...(priority && { priority }),
  };

  const [rfqs, total] = await Promise.all([
    prisma.rfq.findMany({
      where,
      include: {
        requestedBy: { select: { id: true, name: true, email: true } },
        lineItems: true,
        _count: { select: { quotes: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.rfq.count({ where }),
  ]);

  res.json({
    data: rfqs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// ─── Get single RFQ ─────────────────────────────────────────
rfqRouter.get("/:id", async (req, res) => {
  const rfq = await prisma.rfq.findUnique({
    where: { id: req.params.id },
    include: {
      requestedBy: { select: { id: true, name: true, email: true } },
      lineItems: true,
      quotes: {
        include: { vendor: { include: { contacts: true, certifications: true } } },
        orderBy: { totalPrice: "asc" },
      },
    },
  });
  if (!rfq) throw new AppError(404, "RFQ not found");
  res.json(rfq);
});

// ─── Create RFQ ─────────────────────────────────────────────
rfqRouter.post("/", async (req, res) => {
  const data = createRfqSchema.parse(req.body);
  const { lineItems, ...rfqData } = data;

  // Generate sequential RFQ number
  const count = await prisma.rfq.count();
  const rfqNumber = `RFQ-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

  const rfq = await prisma.rfq.create({
    data: {
      ...rfqData,
      rfqNumber,
      requiredDeliveryDate: rfqData.requiredDeliveryDate
        ? new Date(rfqData.requiredDeliveryDate)
        : undefined,
      requestedById: req.user!.userId,
      lineItems: {
        createMany: {
          data: lineItems.map((li) => ({
            ...li,
            specifications: li.specifications
              ? (li.specifications as Record<string, string>)
              : undefined,
          })),
        },
      },
    },
    include: {
      requestedBy: { select: { id: true, name: true, email: true } },
      lineItems: true,
    },
  });

  res.status(201).json(rfq);
});

// ─── Update RFQ status ──────────────────────────────────────
rfqRouter.patch("/:id", async (req, res) => {
  const existing = await prisma.rfq.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new AppError(404, "RFQ not found");

  const rfq = await prisma.rfq.update({
    where: { id: req.params.id },
    data: req.body,
    include: {
      requestedBy: { select: { id: true, name: true, email: true } },
      lineItems: true,
      _count: { select: { quotes: true } },
    },
  });

  res.json(rfq);
});

// ─── Delete RFQ ─────────────────────────────────────────────
rfqRouter.delete("/:id", async (req, res) => {
  const existing = await prisma.rfq.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new AppError(404, "RFQ not found");

  await prisma.rfq.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
