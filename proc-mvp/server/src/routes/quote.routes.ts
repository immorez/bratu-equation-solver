import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.js";
import { AppError } from "../middleware/error-handler.js";
import {
  createQuoteSchema,
  updateQuoteStatusSchema,
} from "../schemas/quote.schema.js";

export const quoteRouter = Router();
quoteRouter.use(authenticate);

// ─── List quotes for an RFQ ─────────────────────────────────
quoteRouter.get("/rfq/:rfqId", async (req, res) => {
  const quotes = await prisma.quote.findMany({
    where: { rfqId: req.params.rfqId },
    include: {
      vendor: {
        include: { contacts: true, certifications: true },
      },
    },
    orderBy: { totalPrice: "asc" },
  });
  res.json(quotes);
});

// ─── Get single quote ───────────────────────────────────────
quoteRouter.get("/:id", async (req, res) => {
  const quote = await prisma.quote.findUnique({
    where: { id: req.params.id },
    include: {
      vendor: { include: { contacts: true, certifications: true } },
      rfq: { include: { lineItems: true } },
    },
  });
  if (!quote) throw new AppError(404, "Quote not found");
  res.json(quote);
});

// ─── Create quote ───────────────────────────────────────────
quoteRouter.post("/", async (req, res) => {
  const data = createQuoteSchema.parse(req.body);

  // Verify RFQ and vendor exist
  const [rfq, vendor] = await Promise.all([
    prisma.rfq.findUnique({ where: { id: data.rfqId } }),
    prisma.vendor.findUnique({ where: { id: data.vendorId } }),
  ]);
  if (!rfq) throw new AppError(404, "RFQ not found");
  if (!vendor) throw new AppError(404, "Vendor not found");

  const quote = await prisma.quote.create({
    data: {
      ...data,
      validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
    },
    include: { vendor: true, rfq: true },
  });

  // Update RFQ status to QUOTING if still in SENT
  if (rfq.status === "SENT") {
    await prisma.rfq.update({
      where: { id: rfq.id },
      data: { status: "QUOTING" },
    });
  }

  res.status(201).json(quote);
});

// ─── Update quote status ────────────────────────────────────
quoteRouter.patch("/:id/status", async (req, res) => {
  const { status } = updateQuoteStatusSchema.parse(req.body);

  const existing = await prisma.quote.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new AppError(404, "Quote not found");

  const quote = await prisma.quote.update({
    where: { id: req.params.id },
    data: { status },
    include: { vendor: true, rfq: true },
  });

  res.json(quote);
});

// ─── Compare quotes for an RFQ ──────────────────────────────
quoteRouter.get("/rfq/:rfqId/compare", async (req, res) => {
  const rfq = await prisma.rfq.findUnique({
    where: { id: req.params.rfqId },
    include: { lineItems: true },
  });
  if (!rfq) throw new AppError(404, "RFQ not found");

  const quotes = await prisma.quote.findMany({
    where: { rfqId: req.params.rfqId },
    include: {
      vendor: { include: { certifications: true } },
    },
    orderBy: { totalPrice: "asc" },
  });

  if (quotes.length === 0) {
    return res.json({ rfq, quotes: [], comparison: null });
  }

  // Build comparison matrix
  const prices = quotes.map((q) => q.totalPrice);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const leadTimes = quotes.map((q) => q.leadTimeDays);
  const minLead = Math.min(...leadTimes);
  const maxLead = Math.max(...leadTimes);

  const comparison = quotes.map((q) => {
    const priceScore =
      maxPrice === minPrice ? 1 : (maxPrice - q.totalPrice) / (maxPrice - minPrice);
    const leadScore =
      maxLead === minLead ? 1 : (maxLead - q.leadTimeDays) / (maxLead - minLead);
    const qualityScore = q.vendor.qualityScore / 10;
    const reliabilityScore = q.vendor.reliabilityScore / 10;

    const finalScore =
      priceScore * 0.35 +
      qualityScore * 0.25 +
      leadScore * 0.15 +
      reliabilityScore * 0.15 +
      0.1; // placeholder payment terms score

    return {
      quoteId: q.id,
      vendorId: q.vendorId,
      vendorName: q.vendor.companyName,
      country: q.vendor.country,
      totalPrice: q.totalPrice,
      unitPrice: q.unitPrice,
      leadTimeDays: q.leadTimeDays,
      qualityScore: q.vendor.qualityScore,
      reliabilityScore: q.vendor.reliabilityScore,
      certifications: q.vendor.certifications.map((c) => c.name),
      paymentTerms: q.paymentTerms,
      finalScore: Math.round(finalScore * 1000) / 10, // 0–100
    };
  });

  comparison.sort((a, b) => b.finalScore - a.finalScore);

  res.json({ rfq, quotes, comparison });
});
