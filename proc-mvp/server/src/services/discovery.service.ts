/**
 * Vendor Discovery Service — the brain of the discovery system.
 *
 * Orchestrates the full pipeline:
 * 1. Generate search queries from product categories × target countries
 * 2. Search for vendors (web search via SerpAPI, AI research, or mock)
 * 3. Price discovery via SerpAPI Google Shopping (high-confidence SERP data, no AI)
 * 4. Extract structured vendor profiles; enrich with price ranges
 * 5. Deduplicate against existing vendors & same-job results
 * 6. Store discovery results (including priceMin, priceMax, priceDiscovery)
 * 7. Optionally auto-import high-confidence results
 *
 * Price discovery uses SERP scraping (Google Shopping API) for structured
 * price data — no AI extraction needed, high confidence.
 *
 * Runs in the background with batch processing and progress tracking.
 */

import { prisma } from "../lib/prisma.js";
import { startBackgroundJob, cancelJob as cancelBgJob } from "./job-runner.js";
import { createSearchProvider } from "./search-provider.js";
import {
  researchVendors,
  extractVendorsFromResults,
  generateMockVendors,
  type ExtractedVendor,
} from "./vendor-extractor.js";
import { discoverPrices, type PriceDiscoveryResult } from "./price-discovery.service.js";
import { storeProductsFromPriceDiscovery, storeProductFromResult } from "./product-discovery.service.js";
import type { CreateDiscoveryJobInput } from "../schemas/discovery.schema.js";

// ─── Types ────────────────────────────────────────────────────

interface SearchQuery {
  productCategory: string;
  country: string;
  query: string;
}

type DiscoveryMode = "ai-research" | "web-search" | "mock";

// ─── Discovery Mode Detection ─────────────────────────────────

function detectDiscoveryMode(): DiscoveryMode {
  if (process.env.OPENAI_API_KEY && process.env.SERP_API_KEY) {
    return "web-search";
  }
  if (process.env.OPENAI_API_KEY) {
    return "ai-research";
  }
  return "mock";
}

export function getDiscoveryMode(): DiscoveryMode {
  return detectDiscoveryMode();
}

// ─── Query Generation ─────────────────────────────────────────

function generateSearchQueries(
  categories: string[],
  countries: string[],
): SearchQuery[] {
  return categories.flatMap((product) =>
    countries.map((country) => ({
      productCategory: product,
      country,
      query: `${product} manufacturer supplier ${country}`,
    })),
  );
}

// ─── Batch Processing Utility ─────────────────────────────────

async function processInBatches<T, R>(
  items: T[],
  batchSize: number,
  processor: (item: T) => Promise<R>,
  options?: {
    signal?: AbortSignal;
    onBatchDone?: (completed: number, total: number) => void | Promise<void>;
    delayMs?: number;
  },
): Promise<R[]> {
  const results: R[] = [];
  const total = items.length;

  for (let i = 0; i < total; i += batchSize) {
    if (options?.signal?.aborted) {
      throw new Error("Job cancelled");
    }

    const batch = items.slice(i, Math.min(i + batchSize, total));
    const batchResults = await Promise.allSettled(batch.map(processor));

    for (const result of batchResults) {
      if (result.status === "fulfilled") {
        results.push(result.value);
      } else {
        console.error("[Discovery] Batch item failed:", result.reason);
      }
    }

    const completed = Math.min(i + batchSize, total);
    await options?.onBatchDone?.(completed, total);

    // Throttle between batches to respect API rate limits
    if (options?.delayMs && i + batchSize < total) {
      await sleep(options.delayMs);
    }
  }

  return results;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Enrich vendors with price data from Google Shopping SERP.
 * High-confidence structured data — no AI extraction needed.
 */
function enrichVendorsWithPrices(
  vendors: ExtractedVendor[],
  priceData: PriceDiscoveryResult,
): ExtractedVendor[] {
  if (priceData.sampleSize === 0) return vendors;

  return vendors.map((v) => ({
    ...v,
    priceMin: priceData.minPrice,
    priceMax: priceData.maxPrice,
    priceCurrency: "USD",
    priceDiscovery: {
      productCategory: priceData.productCategory,
      country: priceData.country,
      sampleSize: priceData.sampleSize,
      prices: priceData.prices.slice(0, 5), // Store top 5 for audit
    },
  }));
}

// ─── Public API ───────────────────────────────────────────────

/**
 * Create and start a vendor discovery job.
 * Returns immediately with the job record; actual discovery runs in background.
 */
export async function createDiscoveryJob(input: CreateDiscoveryJobInput) {
  const mode = detectDiscoveryMode();
  const queries = generateSearchQueries(
    input.productCategories,
    input.targetCountries,
  );

  const job = await prisma.discoveryJob.create({
    data: {
      ...(input.need && { need: input.need }),
      productCategories: input.productCategories,
      targetCountries: input.targetCountries,
      searchQueries: queries.map((q) => q.query),
      maxVendorsPerQuery: input.maxVendorsPerQuery,
      autoImport: input.autoImport,
      autoImportThreshold: input.autoImportThreshold,
      discoveryMode: mode,
      status: "PENDING",
    },
  });

  console.log(
    `[Discovery] Job ${job.id} created | mode=${mode} | queries=${queries.length} | autoImport=${input.autoImport}`,
  );

  // Start the discovery pipeline in the background
  startBackgroundJob(job.id, (signal) =>
    executeDiscoveryJob(job.id, queries, mode, signal),
  );

  return job;
}

/**
 * Cancel a running or pending discovery job.
 */
export async function cancelDiscoveryJob(jobId: string) {
  const job = await prisma.discoveryJob.findUnique({ where: { id: jobId } });
  if (!job) throw new Error("Job not found");
  if (job.status !== "RUNNING" && job.status !== "PENDING") {
    throw new Error(`Cannot cancel job in ${job.status} status`);
  }

  cancelBgJob(jobId);

  return prisma.discoveryJob.update({
    where: { id: jobId },
    data: {
      status: "CANCELLED",
      completedAt: new Date(),
    },
  });
}

/**
 * Import a single discovery result as a real vendor.
 * Creates Vendor + contacts + products + certifications.
 */
export async function importDiscoveryResult(resultId: string) {
  const result = await prisma.discoveryResult.findUnique({
    where: { id: resultId },
  });

  if (!result) throw new Error("Discovery result not found");
  if (result.imported) throw new Error("Result already imported");
  if (result.skipped) throw new Error("Result was skipped");

  // Build contacts from available data
  const contacts: Array<{ type: string; value: string }> = [];
  if (result.email) contacts.push({ type: "email", value: result.email });
  if (result.phone) contacts.push({ type: "phone", value: result.phone });

  // Create the vendor
  const vendor = await prisma.vendor.create({
    data: {
      companyName: result.companyName,
      country: result.country || "Unknown",
      website: result.website,
      companySize: result.companySize,
      yearsInBusiness: result.yearsInBusiness,
      status: "DISCOVERED",
      qualityScore: 0,
      reliabilityScore: 0,
      performanceScore: 0,
      responseRate: 0,
      contacts:
        contacts.length > 0
          ? { createMany: { data: contacts } }
          : undefined,
      products:
        result.productCategories.length > 0
          ? {
              createMany: {
                data: result.productCategories.map((cat) => {
                  const r = result as {
                    priceMin?: number | null;
                    priceMax?: number | null;
                    priceCurrency?: string | null;
                  };
                  return {
                    productCategory: cat,
                    priceRange:
                      r.priceMin != null || r.priceMax != null
                        ? {
                            min: r.priceMin,
                            max: r.priceMax,
                            currency: r.priceCurrency ?? "USD",
                          }
                        : undefined,
                  };
                }),
              },
            }
          : undefined,
      certifications:
        result.certifications.length > 0
          ? {
              createMany: {
                data: result.certifications.map((name) => ({ name })),
              },
            }
          : undefined,
    },
    include: {
      contacts: true,
      products: true,
      certifications: true,
    },
  });

  // Mark the result as imported
  const updatedResult = await prisma.discoveryResult.update({
    where: { id: resultId },
    data: { imported: true, vendorId: vendor.id },
  });

  // Bump the job's import counter
  await prisma.discoveryJob.update({
    where: { id: result.jobId },
    data: { totalImported: { increment: 1 } },
  });

  return { vendor, result: updatedResult };
}

/**
 * Skip a discovery result (mark it as not worth importing).
 */
export async function skipDiscoveryResult(
  resultId: string,
  reason?: string,
) {
  const result = await prisma.discoveryResult.findUnique({
    where: { id: resultId },
  });
  if (!result) throw new Error("Discovery result not found");
  if (result.imported) throw new Error("Result already imported");

  return prisma.discoveryResult.update({
    where: { id: resultId },
    data: {
      skipped: true,
      skipReason: reason || "Manually skipped",
    },
  });
}

/**
 * Import multiple discovery results at once.
 * Skips individual failures so one bad result doesn't block the rest.
 */
export async function batchImportResults(resultIds: string[]) {
  const imported: Array<{
    vendor: Awaited<ReturnType<typeof importDiscoveryResult>>["vendor"];
    result: Awaited<ReturnType<typeof importDiscoveryResult>>["result"];
  }> = [];
  const errors: Array<{ resultId: string; error: string }> = [];

  for (const id of resultIds) {
    try {
      const res = await importDiscoveryResult(id);
      imported.push(res);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error(`[Discovery] Batch import failed for ${id}:`, message);
      errors.push({ resultId: id, error: message });
    }
  }

  return { imported, errors };
}

// ─── Background Job Execution ─────────────────────────────────

async function executeDiscoveryJob(
  jobId: string,
  queries: SearchQuery[],
  mode: DiscoveryMode,
  signal: AbortSignal,
): Promise<void> {
  console.log(
    `[Discovery] Starting job ${jobId} | mode=${mode} | ${queries.length} queries`,
  );

  try {
    // Mark as running
    const job = await prisma.discoveryJob.update({
      where: { id: jobId },
      data: { status: "RUNNING", startedAt: new Date() },
    });

    let totalFound = 0;
    let totalNew = 0;
    let totalSkipped = 0;

    // Process queries in batches
    const BATCH_SIZE = mode === "mock" ? 4 : 2;
    const DELAY_MS = mode === "web-search" ? 2000 : mode === "ai-research" ? 1500 : 200;

    await processInBatches(
      queries,
      BATCH_SIZE,
      async (query) => {
        console.log(
          `[Discovery] Researching: "${query.productCategory}" in ${query.country}`,
        );

        // ── Step 1: Get vendor candidates ──
        let vendors: ExtractedVendor[] = [];

        if (mode === "ai-research") {
          vendors = await researchVendors(
            query.productCategory,
            query.country,
            job.maxVendorsPerQuery,
          );
          // Enrich with price discovery when SerpAPI available (SERP scraping for high-confidence data)
          if (process.env.SERP_API_KEY) {
            await sleep(800); // Throttle SerpAPI calls
            const priceData = await discoverPrices(
              query.productCategory,
              query.country,
              12,
            );
            if (priceData.sampleSize > 0) {
              vendors = enrichVendorsWithPrices(vendors, priceData);
              await storeProductsFromPriceDiscovery(jobId, priceData);
              console.log(
                `[Discovery] Price enrichment: $${priceData.minPrice.toFixed(2)}–$${priceData.maxPrice.toFixed(2)} for "${query.productCategory}"`,
              );
            }
          }
        } else if (mode === "web-search") {
          // Step 1a: Web search for vendor discovery
          const provider = createSearchProvider();
          const searchResults = await provider.search(
            query.query,
            job.maxVendorsPerQuery,
          );
          vendors = await extractVendorsFromResults(
            searchResults,
            query.productCategory,
            query.country,
          );

          // Step 1b: Price discovery via SerpAPI Google Shopping (high-confidence SERP data)
          await sleep(1000); // Throttle between Search + Shopping API calls
          const priceData = await discoverPrices(
            query.productCategory,
            query.country,
            12,
          );
          if (priceData.sampleSize > 0) {
            vendors = enrichVendorsWithPrices(vendors, priceData);
            await storeProductsFromPriceDiscovery(jobId, priceData);
            console.log(
              `[Discovery] Price range for "${query.productCategory}": $${priceData.minPrice.toFixed(2)}–$${priceData.maxPrice.toFixed(2)} (${priceData.sampleSize} SERP results)`,
            );
          }
        } else {
          vendors = generateMockVendors(
            query.productCategory,
            query.country,
            Math.min(5, job.maxVendorsPerQuery),
          );
          // Mock mode: create sample products for the job
          await storeProductsFromPriceDiscovery(jobId, {
            productCategory: query.productCategory,
            country: query.country,
            prices: [
              { title: `${query.productCategory} - Option A`, extractedPrice: 89, price: "$89", source: "Mock", link: "" },
              { title: `${query.productCategory} - Option B`, extractedPrice: 145, price: "$145", source: "Mock", link: "" },
              { title: `${query.productCategory} - Option C`, extractedPrice: 199, price: "$199", source: "Mock", link: "" },
            ],
            minPrice: 89,
            maxPrice: 199,
            avgPrice: 144.33,
            sampleSize: 3,
          });
        }

        console.log(
          `[Discovery] Found ${vendors.length} candidates for "${query.productCategory}" in ${query.country}`,
        );

        // ── Step 2: Deduplicate and store each vendor ──
        for (const vendor of vendors) {
          totalFound++;

          const duplicate = await checkDuplicate(vendor, jobId);

          const createData: Record<string, unknown> = {
            jobId,
            companyName: vendor.companyName,
            country: vendor.country,
            website: vendor.website,
            email: vendor.email,
            phone: vendor.phone,
            description: vendor.description,
            productCategories: vendor.productCategories,
            certifications: vendor.certifications,
            companySize: vendor.companySize,
            yearsInBusiness: vendor.yearsInBusiness,
            source: mode,
            confidence: vendor.confidence,
            rawData: vendor as object,
          };
          if (vendor.priceMin != null) createData.priceMin = vendor.priceMin;
          if (vendor.priceMax != null) createData.priceMax = vendor.priceMax;
          if (vendor.priceCurrency) createData.priceCurrency = vendor.priceCurrency;
          if (vendor.priceDiscovery)
            createData.priceDiscovery = vendor.priceDiscovery as object;

          if (duplicate) {
            totalSkipped++;
            await prisma.discoveryResult.create({
              data: {
                ...createData,
                skipped: true,
                skipReason: duplicate,
              } as Parameters<typeof prisma.discoveryResult.create>[0]["data"],
            });
          } else {
            totalNew++;
            const result = await prisma.discoveryResult.create({
              data: createData as Parameters<
                typeof prisma.discoveryResult.create
              >[0]["data"],
            });

            // Store product from result when we have price data (vendor offering)
            if (
              vendor.priceMin != null &&
              vendor.priceMax != null &&
              query.productCategory &&
              query.country
            ) {
              storeProductFromResult(
                jobId,
                result.id,
                query.productCategory,
                query.country,
                vendor.priceMin,
                vendor.priceMax,
                vendor.priceCurrency ?? "USD",
                vendor.companyName,
              ).catch((err) =>
                console.error("[Discovery] Failed to store product from result:", err),
              );
            }

            // Auto-import if configured and confidence passes threshold
            if (
              job.autoImport &&
              vendor.confidence >= job.autoImportThreshold
            ) {
              try {
                await importDiscoveryResult(result.id);
                console.log(
                  `[Discovery] Auto-imported: ${vendor.companyName} (confidence: ${vendor.confidence.toFixed(2)})`,
                );
              } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : "unknown";
                console.error(
                  `[Discovery] Auto-import failed for ${vendor.companyName}: ${msg}`,
                );
              }
            }
          }
        }
      },
      {
        signal,
        delayMs: DELAY_MS,
        onBatchDone: async (completed, total) => {
          const progress = Math.round((completed / total) * 100);
          await prisma.discoveryJob.update({
            where: { id: jobId },
            data: { progress, totalFound, totalNew, totalSkipped },
          });
          console.log(
            `[Discovery] Progress: ${progress}% (${completed}/${total} queries) | found=${totalFound} new=${totalNew} skipped=${totalSkipped}`,
          );
        },
      },
    );

    // ── Final stats ──
    const finalImported = await prisma.discoveryResult.count({
      where: { jobId, imported: true },
    });

    await prisma.discoveryJob.update({
      where: { id: jobId },
      data: {
        status: "COMPLETED",
        progress: 100,
        totalFound,
        totalNew,
        totalSkipped,
        totalImported: finalImported,
        completedAt: new Date(),
      },
    });

    console.log(
      `[Discovery] Job ${jobId} COMPLETED | found=${totalFound} new=${totalNew} skipped=${totalSkipped} imported=${finalImported}`,
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";

    if (signal.aborted) {
      console.log(`[Discovery] Job ${jobId} was cancelled`);
      await prisma.discoveryJob
        .update({
          where: { id: jobId },
          data: { status: "CANCELLED", completedAt: new Date() },
        })
        .catch(() => {}); // best-effort
    } else {
      console.error(`[Discovery] Job ${jobId} FAILED:`, message);
      await prisma.discoveryJob
        .update({
          where: { id: jobId },
          data: {
            status: "FAILED",
            error: message,
            completedAt: new Date(),
          },
        })
        .catch(() => {}); // best-effort
    }
  }
}

// ─── Deduplication ────────────────────────────────────────────

/**
 * Check if a vendor already exists in the database or in the same job.
 * Returns a reason string if duplicate, or null if unique.
 */
async function checkDuplicate(
  vendor: ExtractedVendor,
  jobId: string,
): Promise<string | null> {
  // Check existing vendors by company name (case-insensitive)
  const byName = await prisma.vendor.findFirst({
    where: {
      companyName: { equals: vendor.companyName, mode: "insensitive" },
    },
  });
  if (byName) return `Vendor "${byName.companyName}" already exists in database`;

  // Check existing vendors by website
  if (vendor.website) {
    const normalized = normalizeUrl(vendor.website);
    const byWebsite = await prisma.vendor.findFirst({
      where: {
        website: { contains: normalized, mode: "insensitive" },
      },
    });
    if (byWebsite)
      return `Vendor with website "${byWebsite.website}" already exists`;
  }

  // Check other results in the same job (avoid intra-job duplicates)
  const byJobResult = await prisma.discoveryResult.findFirst({
    where: {
      jobId,
      companyName: { equals: vendor.companyName, mode: "insensitive" },
    },
  });
  if (byJobResult)
    return `Duplicate within same discovery job`;

  return null;
}

function normalizeUrl(url: string): string {
  return url
    .replace(/^https?:\/\/(www\.)?/, "")
    .replace(/\/$/, "")
    .toLowerCase();
}
