import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.js";
import { AppError } from "../middleware/error-handler.js";
import {
  createDiscoveryJobSchema,
  discoveryJobQuerySchema,
  batchImportSchema,
  skipResultSchema,
} from "../schemas/discovery.schema.js";
import {
  createDiscoveryJob,
  cancelDiscoveryJob,
  importDiscoveryResult,
  skipDiscoveryResult,
  batchImportResults,
  getDiscoveryMode,
} from "../services/discovery.service.js";
import { getProductsForJob } from "../services/product-discovery.service.js";
import { isJobRunning, getActiveJobCount } from "../services/job-runner.js";

export const discoveryRouter = Router();
discoveryRouter.use(authenticate);

// ─── System Status ──────────────────────────────────────────

/** GET /api/discovery/status — overall discovery system info */
discoveryRouter.get("/status", async (_req, res) => {
  const [totalJobs, runningJobs, completedJobs, totalResults, importedResults] =
    await Promise.all([
      prisma.discoveryJob.count(),
      prisma.discoveryJob.count({ where: { status: "RUNNING" } }),
      prisma.discoveryJob.count({ where: { status: "COMPLETED" } }),
      prisma.discoveryResult.count(),
      prisma.discoveryResult.count({ where: { imported: true } }),
    ]);

  const mode = getDiscoveryMode();

  res.json({
    mode,
    activeInMemory: getActiveJobCount(),
    jobs: { total: totalJobs, running: runningJobs, completed: completedJobs },
    results: { total: totalResults, imported: importedResults },
    capabilities: {
      openai: !!process.env.OPENAI_API_KEY,
      serpapi: !!process.env.SERP_API_KEY,
    },
  });
});

// ─── Jobs ───────────────────────────────────────────────────

/** POST /api/discovery/jobs — create and start a new discovery job */
discoveryRouter.post("/jobs", async (req, res) => {
  const input = createDiscoveryJobSchema.parse(req.body);
  const job = await createDiscoveryJob(input);
  res.status(201).json(job);
});

/** GET /api/discovery/jobs — list all discovery jobs */
discoveryRouter.get("/jobs", async (req, res) => {
  const query = discoveryJobQuerySchema.parse(req.query);
  const { page, limit, status } = query;

  const where = status ? { status: status as any } : {};

  const [jobs, total] = await Promise.all([
    prisma.discoveryJob.findMany({
      where,
      include: {
        _count: { select: { results: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.discoveryJob.count({ where }),
  ]);

  const enrichedJobs = jobs.map((job) => ({
    ...job,
    isRunning: isJobRunning(job.id),
  }));

  res.json({
    data: enrichedJobs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    activeJobCount: getActiveJobCount(),
  });
});

/** GET /api/discovery/jobs/:id — get job details with all results and products */
discoveryRouter.get("/jobs/:id", async (req, res) => {
  const job = await prisma.discoveryJob.findUnique({
    where: { id: req.params.id },
    include: {
      results: {
        orderBy: [
          { imported: "desc" },
          { skipped: "asc" },
          { confidence: "desc" },
        ],
      },
    },
  });

  if (!job) throw new AppError(404, "Discovery job not found");

  // Separate results into categories for easier consumption
  const imported = job.results.filter((r) => r.imported);
  const available = job.results.filter((r) => !r.imported && !r.skipped);
  const skipped = job.results.filter((r) => r.skipped);

  // Get products and alternatives for this job
  const productsData = await getProductsForJob(job.id);

  res.json({
    ...job,
    isRunning: isJobRunning(job.id),
    summary: {
      imported: imported.length,
      available: available.length,
      skipped: skipped.length,
    },
    products: productsData.products,
    productsByAlternatives: productsData.byCategory,
  });
});

/** POST /api/discovery/jobs/:id/cancel — cancel a running job */
discoveryRouter.post("/jobs/:id/cancel", async (req, res) => {
  try {
    const job = await cancelDiscoveryJob(req.params.id);
    res.json(job);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    throw new AppError(400, message);
  }
});

// ─── Results ────────────────────────────────────────────────

/** GET /api/discovery/results — list results across all jobs with filters */
discoveryRouter.get("/results", async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const jobId = req.query.jobId as string | undefined;
  const imported = req.query.imported === "true" ? true : req.query.imported === "false" ? false : undefined;
  const skipped = req.query.skipped === "true" ? true : req.query.skipped === "false" ? false : undefined;
  const minConfidence = req.query.minConfidence ? Number(req.query.minConfidence) : undefined;

  const where: any = {};
  if (jobId) where.jobId = jobId;
  if (imported !== undefined) where.imported = imported;
  if (skipped !== undefined) where.skipped = skipped;
  if (minConfidence !== undefined) where.confidence = { gte: minConfidence };

  const [results, total] = await Promise.all([
    prisma.discoveryResult.findMany({
      where,
      orderBy: { confidence: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.discoveryResult.count({ where }),
  ]);

  res.json({
    data: results,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

/** POST /api/discovery/results/:id/import — import a result as a vendor */
discoveryRouter.post("/results/:id/import", async (req, res) => {
  try {
    const { vendor, result } = await importDiscoveryResult(req.params.id);
    res.status(201).json({ vendor, result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    throw new AppError(400, message);
  }
});

/** POST /api/discovery/results/:id/skip — skip a result */
discoveryRouter.post("/results/:id/skip", async (req, res) => {
  const { reason } = skipResultSchema.parse(req.body);
  try {
    const result = await skipDiscoveryResult(req.params.id, reason);
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    throw new AppError(400, message);
  }
});

/** POST /api/discovery/results/batch-import — import multiple results at once */
discoveryRouter.post("/results/batch-import", async (req, res) => {
  const { resultIds } = batchImportSchema.parse(req.body);
  const { imported, errors } = await batchImportResults(resultIds);

  res.status(201).json({
    imported: imported.length,
    failed: errors.length,
    results: imported,
    errors,
  });
});
