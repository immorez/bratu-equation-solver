/**
 * AI-powered vendor data extraction and research.
 *
 * Three modes:
 * 1. AI Research: Uses OpenAI to research vendors by product+country
 * 2. Web Extraction: Uses OpenAI to extract vendor data from search results
 * 3. Mock: Generates deterministic sample data (no API keys needed)
 */

import OpenAI from "openai";

export interface ExtractedVendor {
  companyName: string;
  country: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  description: string | null;
  productCategories: string[];
  certifications: string[];
  companySize: string | null;
  yearsInBusiness: number | null;
  confidence: number;
  /** Price range from SERP Shopping (high-confidence structured data) */
  priceMin?: number;
  priceMax?: number;
  priceCurrency?: string;
  priceDiscovery?: unknown;
}

interface SearchResultInput {
  title: string;
  url: string;
  snippet: string;
}

// ─── OpenAI Client ────────────────────────────────────────────

let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

// ─── AI Research Mode ─────────────────────────────────────────

/**
 * Uses OpenAI to research and generate vendor profiles.
 * Good for MVP: leverages AI knowledge of real manufacturers.
 */
export async function researchVendors(
  productCategory: string,
  country: string,
  maxResults: number = 10,
): Promise<ExtractedVendor[]> {
  const openai = getOpenAI();

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content: `You are a procurement research specialist with deep knowledge of global manufacturers and suppliers.

RULES:
- Only include companies you have reasonable knowledge about
- Prefer well-known, established companies in the industry
- If you know a real company, include it with high confidence (0.7-0.95)
- For less certain entries, set confidence to 0.4-0.6
- Do NOT fabricate specific contact emails or phone numbers — leave them null if unknown
- Website URLs should be realistic; set to null if unsure
- Be specific about certifications only when confident
- Product categories should reflect what the vendor actually produces`,
      },
      {
        role: "user",
        content: `Research and identify up to ${maxResults} manufacturers/suppliers of "${productCategory}" in ${country}.

Return a JSON object:
{
  "vendors": [
    {
      "companyName": "string - full company name",
      "country": "${country}",
      "website": "string or null",
      "email": "string or null",
      "phone": "string or null",
      "description": "string - 1-2 sentence company description",
      "productCategories": ["products they offer"],
      "certifications": ["ISO 9001", etc.],
      "companySize": "Small | Medium | Large | null",
      "yearsInBusiness": "number or null",
      "confidence": "number 0-1"
    }
  ]
}

Focus on well-established companies known in the ${productCategory} industry in ${country}.`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
    max_tokens: 4000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) return [];

  try {
    const parsed = JSON.parse(content) as { vendors?: unknown[] };
    return (parsed.vendors || []).map(sanitizeVendor);
  } catch (err) {
    console.error("[VendorExtractor] Failed to parse AI research response:", err);
    return [];
  }
}

// ─── Extract from Search Results ──────────────────────────────

/**
 * Uses OpenAI to extract structured vendor data from web search results.
 * Used in web-search mode after SerpAPI returns raw results.
 */
export async function extractVendorsFromResults(
  results: SearchResultInput[],
  productCategory: string,
  country: string,
): Promise<ExtractedVendor[]> {
  if (results.length === 0) return [];

  const openai = getOpenAI();

  const resultsText = results
    .map(
      (r, i) =>
        `[${i + 1}] Title: ${r.title}\n    URL: ${r.url}\n    Snippet: ${r.snippet}`,
    )
    .join("\n\n");

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content: `You are analyzing web search results to identify vendors and suppliers.

RULES:
- Only include entries that are clearly vendors, manufacturers, or suppliers
- Skip directories, listing sites, news articles, and non-vendor pages
- Extract as much information as possible from the title and snippet
- Use the URL domain as the website
- Set confidence based on how clearly the result identifies a real vendor`,
      },
      {
        role: "user",
        content: `I searched for "${productCategory}" suppliers in "${country}".

Search results:
${resultsText}

Extract vendor information. Return a JSON object:
{
  "vendors": [
    {
      "companyName": "string",
      "country": "${country}",
      "website": "string from the URL",
      "email": "string or null",
      "phone": "string or null",
      "description": "string from snippet",
      "productCategories": ["${productCategory}", ...],
      "certifications": ["any mentioned"],
      "companySize": "Small | Medium | Large | null",
      "yearsInBusiness": "number or null",
      "confidence": "number 0-1"
    }
  ]
}

Only include results that represent actual vendors/manufacturers.`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
    max_tokens: 4000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) return [];

  try {
    const parsed = JSON.parse(content) as { vendors?: unknown[] };
    return (parsed.vendors || []).map(sanitizeVendor);
  } catch (err) {
    console.error("[VendorExtractor] Failed to parse extraction response:", err);
    return [];
  }
}

// ─── Mock Vendor Generation ───────────────────────────────────

/**
 * Generates deterministic mock vendor data for development.
 * No API keys needed — useful for local dev and testing.
 */
export function generateMockVendors(
  productCategory: string,
  country: string,
  count: number = 5,
): ExtractedVendor[] {
  const pools: Record<string, Array<{ name: string; size: string; years: number; website: string }>> = {
    China: [
      { name: "Shandong Kunlong Metal Technology Co., Ltd", size: "Large", years: 18, website: "https://kunlongmetal.com" },
      { name: "Jiangsu Eastern Heavy Industry Co., Ltd", size: "Large", years: 22, website: "https://easternheavy.cn" },
      { name: "Tianjin Baosteel International Trading", size: "Medium", years: 12, website: "https://tjbaosteel.com" },
      { name: "Hebei Tongsheng Metal Products Co.", size: "Medium", years: 8, website: "https://tongshengmetal.com" },
      { name: "Zhejiang Huadong Light Industry Group", size: "Large", years: 25, website: "https://hdindustrial.cn" },
      { name: "Wuxi Precision Alloy Manufacturing", size: "Small", years: 6, website: "https://wuxipam.com" },
      { name: "Qingdao Hengxin Industrial Co., Ltd", size: "Medium", years: 14, website: "https://qdhengxin.com" },
    ],
    India: [
      { name: "Tata Steel Processing & Distribution", size: "Large", years: 40, website: "https://tatasteel.com" },
      { name: "Jindal Stainless Ltd", size: "Large", years: 35, website: "https://jindalstainless.com" },
      { name: "APL Apollo Tubes Limited", size: "Large", years: 20, website: "https://aplapollo.com" },
      { name: "Ratnamani Metals & Tubes Ltd", size: "Medium", years: 30, website: "https://ratnamani.com" },
      { name: "Surya Roshni Ltd (Pipes Division)", size: "Medium", years: 28, website: "https://suryaroshni.com" },
      { name: "Man Industries India Ltd", size: "Medium", years: 18, website: "https://manindustries.com" },
    ],
    UAE: [
      { name: "Al Jazeera Steel Products Co. SAOG", size: "Large", years: 20, website: "https://jazeerasteel.com" },
      { name: "Emirates Steel Industries PJSC", size: "Large", years: 15, website: "https://emiratessteel.com" },
      { name: "Gulf Metal Foundry LLC", size: "Medium", years: 12, website: "https://gulfmetalfoundry.ae" },
      { name: "Conares Metal Supply Ltd", size: "Medium", years: 10, website: "https://conares.com" },
    ],
    Turkey: [
      { name: "Tosyali Holding A.S.", size: "Large", years: 30, website: "https://tosyaliholding.com.tr" },
      { name: "Erdemir Group (Eregli Iron & Steel)", size: "Large", years: 55, website: "https://erdemir.com.tr" },
      { name: "Borusan Mannesmann", size: "Large", years: 45, website: "https://borusanmannesmann.com" },
    ],
  };

  const pool = pools[country] || [
    { name: `${country} Industrial Supplies Co.`, size: "Medium", years: 10, website: `https://${country.toLowerCase().replace(/\s/g, "")}industrial.com` },
    { name: `Global ${productCategory} Manufacturing Ltd`, size: "Large", years: 15, website: `https://global${productCategory.toLowerCase().replace(/\s/g, "")}.com` },
    { name: `Premier ${productCategory} Exports`, size: "Small", years: 5, website: `https://premier${productCategory.toLowerCase().replace(/\s/g, "")}exports.com` },
    { name: `${country} Quality Products Corp`, size: "Medium", years: 8, website: `https://${country.toLowerCase().replace(/\s/g, "")}quality.com` },
  ];

  // Deterministic shuffle using product category
  const seed = productCategory
    .split("")
    .reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const shuffled = [...pool].sort(
    (a, b) =>
      ((seed + a.name.charCodeAt(0)) % 97) -
      ((seed + b.name.charCodeAt(0)) % 97),
  );

  return shuffled.slice(0, Math.min(count, shuffled.length)).map((v) => ({
    companyName: v.name,
    country,
    website: v.website,
    email: null,
    phone: null,
    description: `Leading ${productCategory.toLowerCase()} manufacturer and supplier based in ${country}. Provides high-quality products with competitive pricing and reliable delivery.`,
    productCategories: [productCategory],
    certifications: ["ISO 9001"],
    companySize: v.size,
    yearsInBusiness: v.years,
    confidence: 0.55 + (seed % 30) / 100, // deterministic 0.55-0.85
  }));
}

// ─── Helpers ──────────────────────────────────────────────────

function sanitizeVendor(v: unknown): ExtractedVendor {
  const raw = v as Record<string, unknown>;
  return {
    companyName: String(raw.companyName || "Unknown"),
    country: typeof raw.country === "string" ? raw.country : null,
    website: typeof raw.website === "string" ? raw.website : null,
    email: typeof raw.email === "string" ? raw.email : null,
    phone: typeof raw.phone === "string" ? raw.phone : null,
    description: typeof raw.description === "string" ? raw.description : null,
    productCategories: Array.isArray(raw.productCategories)
      ? raw.productCategories.filter((x): x is string => typeof x === "string")
      : [],
    certifications: Array.isArray(raw.certifications)
      ? raw.certifications.filter((x): x is string => typeof x === "string")
      : [],
    companySize: typeof raw.companySize === "string" ? raw.companySize : null,
    yearsInBusiness:
      typeof raw.yearsInBusiness === "number" ? raw.yearsInBusiness : null,
    confidence:
      typeof raw.confidence === "number"
        ? Math.min(1, Math.max(0, raw.confidence))
        : 0.5,
    priceMin: typeof raw.priceMin === "number" ? raw.priceMin : undefined,
    priceMax: typeof raw.priceMax === "number" ? raw.priceMax : undefined,
    priceCurrency: typeof raw.priceCurrency === "string" ? raw.priceCurrency : undefined,
    priceDiscovery: raw.priceDiscovery,
  };
}
