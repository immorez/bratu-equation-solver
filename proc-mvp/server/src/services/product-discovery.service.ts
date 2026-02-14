/**
 * Product Discovery Service — gather products and alternatives per discovery job.
 *
 * Stores products from:
 * - SERP (Google Shopping) — structured price data
 * - Discovery results — vendor-linked products with price ranges
 *
 * Products in the same category are grouped as alternatives (same need).
 */

import { prisma } from "../lib/prisma.js";
import type { PriceDiscoveryResult } from "./price-discovery.service.js";

/**
 * Store products from SERP price discovery into DiscoveryProduct.
 * Products in the same category share an alternativeGroup (alternatives for the same need).
 */
export async function storeProductsFromPriceDiscovery(
  jobId: string,
  priceData: PriceDiscoveryResult,
  resultId?: string,
): Promise<number> {
  if (priceData.prices.length === 0) return 0;

  // Use productCategory + country as alternative group (products serving same need)
  const alternativeGroup = `${priceData.productCategory}|${priceData.country}`;

  const created = await prisma.discoveryProduct.createMany({
    data: priceData.prices.map((p) => ({
      jobId,
      productCategory: priceData.productCategory,
      name: p.title,
      description: p.delivery ? `Delivery: ${p.delivery}` : undefined,
      price: p.extractedPrice,
      priceCurrency: p.currency ?? "USD",
      source: "serp",
      sourceUrl: p.link || undefined,
      sourceVendor: p.source,
      resultId: resultId ?? undefined,
      alternativeGroup,
    })),
    skipDuplicates: true,
  });

  return created.count;
}

/**
 * Store a single product from a discovery result.
 */
export async function storeProductFromResult(
  jobId: string,
  resultId: string,
  productCategory: string,
  country: string,
  priceMin: number,
  priceMax: number,
  currency: string,
  sourceVendor: string,
): Promise<void> {
  const alternativeGroup = `${productCategory}|${country}`;

  await prisma.discoveryProduct.create({
    data: {
      jobId,
      resultId,
      productCategory,
      name: `${productCategory} (${sourceVendor})`,
      price: (priceMin + priceMax) / 2,
      priceCurrency: currency,
      source: "result",
      sourceVendor,
      alternativeGroup,
    },
  });
}

/**
 * Get products for a discovery job, grouped by alternatives.
 */
export async function getProductsForJob(jobId: string) {
  const products = await prisma.discoveryProduct.findMany({
    where: { jobId },
    orderBy: [{ productCategory: "asc" }, { price: "asc" }],
    include: {
      result: {
        select: {
          id: true,
          companyName: true,
          website: true,
          country: true,
        },
      },
    },
  });

  // Group by alternativeGroup
  const byGroup = new Map<string | null, typeof products>();
  for (const p of products) {
    const key = p.alternativeGroup;
    if (!byGroup.has(key)) byGroup.set(key, []);
    byGroup.get(key)!.push(p);
  }

  return {
    products,
    byCategory: Object.fromEntries(
      [...byGroup.entries()].map(([k, v]) => [
        k ?? "ungrouped",
        v.sort((a, b) => a.price - b.price),
      ]),
    ),
  };
}
