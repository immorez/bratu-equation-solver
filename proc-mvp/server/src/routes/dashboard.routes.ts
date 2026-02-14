import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.js";

export const dashboardRouter = Router();
dashboardRouter.use(authenticate);

// ─── Dashboard summary stats ────────────────────────────────
dashboardRouter.get("/stats", async (_req, res) => {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalVendors,
    activeVendors,
    discoveredVendors,
    contactedVendors,
    totalRfqs,
    activeRfqs,
    completedRfqs,
    totalQuotes,
    discoveryJobs,
    runningDiscoveryJobs,
    discoveryResultsTotal,
    discoveryResultsImported,
    discoveredThisWeek,
  ] = await Promise.all([
    prisma.vendor.count(),
    prisma.vendor.count({ where: { status: "ACTIVE" } }),
    prisma.vendor.count({ where: { status: "DISCOVERED" } }),
    prisma.vendor.count({ where: { status: "CONTACTED" } }),
    prisma.rfq.count(),
    prisma.rfq.count({
      where: { status: { in: ["SENT", "QUOTING", "NEGOTIATING", "COMPARING"] } },
    }),
    prisma.rfq.count({ where: { status: "COMPLETED" } }),
    prisma.quote.count(),
    prisma.discoveryJob.count(),
    prisma.discoveryJob.count({ where: { status: "RUNNING" } }),
    prisma.discoveryResult.count(),
    prisma.discoveryResult.count({ where: { imported: true } }),
    prisma.discoveryResult.count({
      where: { imported: true, createdAt: { gte: oneWeekAgo } },
    }),
  ]);

  // Average quotes per RFQ
  const avgQuotesPerRfq = totalRfqs > 0 ? Math.round((totalQuotes / totalRfqs) * 10) / 10 : 0;

  res.json({
    vendors: {
      total: totalVendors,
      active: activeVendors,
      discovered: discoveredVendors,
      contacted: contactedVendors,
    },
    rfqs: {
      total: totalRfqs,
      active: activeRfqs,
      completed: completedRfqs,
    },
    quotes: {
      total: totalQuotes,
      avgPerRfq: avgQuotesPerRfq,
    },
    discovery: {
      totalJobs: discoveryJobs,
      runningJobs: runningDiscoveryJobs,
      totalResults: discoveryResultsTotal,
      importedResults: discoveryResultsImported,
      discoveredThisWeek,
    },
  });
});

// ─── Recent RFQs ────────────────────────────────────────────
dashboardRouter.get("/recent-rfqs", async (_req, res) => {
  const rfqs = await prisma.rfq.findMany({
    include: {
      lineItems: true,
      _count: { select: { quotes: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  res.json(rfqs);
});

// ─── Recent vendors ─────────────────────────────────────────
dashboardRouter.get("/recent-vendors", async (_req, res) => {
  const vendors = await prisma.vendor.findMany({
    include: {
      contacts: true,
      _count: { select: { quotes: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  res.json(vendors);
});
