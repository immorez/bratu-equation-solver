/**
 * Price Discovery Service — SerpAPI Google Shopping integration.
 *
 * Fetches structured price data from Google Shopping SERP for product categories.
 * Used to enrich vendor discovery results with market price intelligence.
 *
 * Flow:
 * 1. Search Google Shopping for product + country
 * 2. Extract prices, sources, and product titles from SERP
 * 3. Return high-confidence price data (no AI needed — structured SERP data)
 */

export interface ShoppingPriceResult {
  title: string;
  price: string;
  extractedPrice: number;
  currency?: string;
  source: string;
  link: string;
  rating?: number;
  reviews?: number;
  delivery?: string;
}

export interface PriceDiscoveryResult {
  productCategory: string;
  country: string;
  prices: ShoppingPriceResult[];
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  sampleSize: number;
}

// Country name → Google gl (country code) for Shopping API
const COUNTRY_TO_GL: Record<string, string> = {
  China: "cn",
  India: "in",
  USA: "us",
  "United States": "us",
  UAE: "ae",
  Turkey: "tr",
  Germany: "de",
  "United Kingdom": "uk",
  UK: "uk",
  Vietnam: "vn",
  Indonesia: "id",
  Thailand: "th",
  Malaysia: "my",
  Mexico: "mx",
  Brazil: "br",
  Italy: "it",
  France: "fr",
  Spain: "es",
  Japan: "jp",
  "South Korea": "kr",
  Korea: "kr",
  Taiwan: "tw",
  Pakistan: "pk",
  Bangladesh: "bd",
  Egypt: "eg",
  "Saudi Arabia": "sa",
};

function getGlForCountry(country: string): string {
  const normalized = country.trim();
  return COUNTRY_TO_GL[normalized] ?? "us";
}

/**
 * Search Google Shopping via SerpAPI for price data.
 * Returns structured price results — no AI extraction needed (high confidence).
 */
export async function searchShoppingPrices(
  productCategory: string,
  country: string,
  maxResults = 15,
): Promise<ShoppingPriceResult[]> {
  const apiKey = process.env.SERP_API_KEY;
  if (!apiKey) {
    console.warn("[PriceDiscovery] SERP_API_KEY not set, skipping shopping search");
    return [];
  }

  const gl = getGlForCountry(country);
  const query = `${productCategory} manufacturer supplier ${country}`;

  const params = new URLSearchParams({
    api_key: apiKey,
    engine: "google_shopping",
    q: query,
    gl,
    hl: "en",
    num: String(Math.min(maxResults, 40)),
  });

  const url = `https://serpapi.com/search?${params.toString()}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`SerpAPI Shopping failed: ${response.statusText}`);
    }

    const data = (await response.json()) as {
      shopping_results?: Array<{
        title?: string;
        price?: string;
        extracted_price?: number;
        source?: string;
        link?: string;
        product_link?: string;
        rating?: number;
        reviews?: number;
        delivery?: string;
      }>;
      inline_shopping_results?: Array<{
        title?: string;
        price?: string;
        extracted_price?: number;
        source?: string;
        link?: string;
        rating?: number;
        reviews?: number;
        delivery?: string;
      }>;
      categorized_shopping_results?: Array<{
        shopping_results?: Array<{
          title?: string;
          price?: string;
          extracted_price?: number;
          source?: string;
          link?: string;
          product_link?: string;
          rating?: number;
          reviews?: number;
          delivery?: string;
        }>;
      }>;
    };

    const results: ShoppingPriceResult[] = [];
    const seen = new Set<string>();

    function addItem(
      item: {
        title?: string;
        price?: string;
        extracted_price?: number;
        source?: string;
        link?: string;
        product_link?: string;
        rating?: number;
        reviews?: number;
        delivery?: string;
      },
    ) {
      const price = item.extracted_price ?? parsePrice(item.price);
      if (price == null || price <= 0) return;

      const key = `${item.title ?? ""}-${item.source ?? ""}-${price}`;
      if (seen.has(key)) return;
      seen.add(key);

      results.push({
        title: item.title || "Unknown",
        price: item.price || String(price),
        extractedPrice: price,
        source: item.source || "Unknown",
        link: item.link || item.product_link || "",
        rating: item.rating,
        reviews: item.reviews,
        delivery: item.delivery,
      });
    }

    // Main shopping_results
    for (const item of data.shopping_results ?? []) {
      addItem(item);
    }

    // Inline results
    for (const item of data.inline_shopping_results ?? []) {
      addItem(item);
    }

    // Categorized results
    for (const cat of data.categorized_shopping_results ?? []) {
      for (const item of cat.shopping_results ?? []) {
        addItem(item);
      }
    }

    return results.slice(0, maxResults);
  } catch (err) {
    console.error("[PriceDiscovery] Shopping search failed:", err);
    return [];
  }
}

function parsePrice(priceStr: string | undefined): number | null {
  if (!priceStr) return null;
  const match = priceStr.replace(/,/g, "").match(/[\d.]+/);
  return match ? parseFloat(match[0]) : null;
}

/**
 * Run price discovery for a product category in a country.
 * Aggregates min/max/avg for the discovery pipeline.
 */
export async function discoverPrices(
  productCategory: string,
  country: string,
  maxResults = 15,
): Promise<PriceDiscoveryResult> {
  const prices = await searchShoppingPrices(productCategory, country, maxResults);

  if (prices.length === 0) {
    return {
      productCategory,
      country,
      prices: [],
      minPrice: 0,
      maxPrice: 0,
      avgPrice: 0,
      sampleSize: 0,
    };
  }

  const values = prices.map((p) => p.extractedPrice).filter((v) => v > 0);
  const minPrice = Math.min(...values);
  const maxPrice = Math.max(...values);
  const avgPrice = values.reduce((a, b) => a + b, 0) / values.length;

  return {
    productCategory,
    country,
    prices,
    minPrice,
    maxPrice,
    avgPrice,
    sampleSize: prices.length,
  };
}
