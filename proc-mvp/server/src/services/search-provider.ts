/**
 * Web search abstraction for vendor discovery.
 *
 * Supports:
 * - SerpAPI (real Google search results)
 * - Mock provider (deterministic sample data for development)
 *
 * Auto-selects the best available provider based on environment variables.
 */

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface SearchProvider {
  name: string;
  search(query: string, maxResults?: number): Promise<SearchResult[]>;
}

// ─── SerpAPI Provider ─────────────────────────────────────────

export class SerpApiProvider implements SearchProvider {
  name = "serpapi";
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async search(query: string, maxResults = 10): Promise<SearchResult[]> {
    const params = new URLSearchParams({
      api_key: this.apiKey,
      q: query,
      num: String(maxResults),
      engine: "google",
    });

    const response = await fetch(
      `https://serpapi.com/search?${params.toString()}`,
    );

    if (!response.ok) {
      throw new Error(`SerpAPI search failed: ${response.statusText}`);
    }

    const data = (await response.json()) as {
      organic_results?: Array<{
        title?: string;
        link?: string;
        snippet?: string;
      }>;
    };

    const organicResults = data.organic_results || [];

    return organicResults.slice(0, maxResults).map((r) => ({
      title: r.title || "",
      url: r.link || "",
      snippet: r.snippet || "",
    }));
  }
}

// ─── Mock Provider ────────────────────────────────────────────

export class MockSearchProvider implements SearchProvider {
  name = "mock";

  async search(query: string, maxResults = 10): Promise<SearchResult[]> {
    const mockCompanies = [
      {
        name: "Pacific Industrial Co., Ltd",
        country: "China",
        domain: "pacificindustrial.cn",
      },
      {
        name: "Rajasthan Metals Pvt Ltd",
        country: "India",
        domain: "rajasthanmetals.in",
      },
      {
        name: "Emirates Manufacturing Group",
        country: "UAE",
        domain: "emiratesmfg.ae",
      },
      {
        name: "Anshan Steel Trading Co.",
        country: "China",
        domain: "anshansteel.com",
      },
      {
        name: "Mumbai Pipes & Fittings Ltd",
        country: "India",
        domain: "mumbaipipes.co.in",
      },
      {
        name: "Sino-Global Supply Chain",
        country: "China",
        domain: "sinoglobalsupply.com",
      },
      {
        name: "Delhi Industrial Solutions",
        country: "India",
        domain: "delhiindustrial.com",
      },
      {
        name: "Dragon Metal Works Ltd",
        country: "China",
        domain: "dragonmetalworks.cn",
      },
      {
        name: "Gulf Precision Manufacturing",
        country: "UAE",
        domain: "gulfprecision.ae",
      },
      {
        name: "Shanghai Heavy Industries",
        country: "China",
        domain: "shanghaihi.com",
      },
      {
        name: "Tata Supplier Network",
        country: "India",
        domain: "tatasupplier.co.in",
      },
      {
        name: "Zhengzhou Materials Corp",
        country: "China",
        domain: "zhengzhoumaterials.com",
      },
    ];

    // Deterministic shuffle based on the query string
    const hash = query
      .split("")
      .reduce((acc, c) => acc + c.charCodeAt(0), 0);

    const shuffled = [...mockCompanies].sort((a, b) => {
      const ha = (hash + a.name.charCodeAt(0)) % 100;
      const hb = (hash + b.name.charCodeAt(0)) % 100;
      return ha - hb;
    });

    // Extract product hint from query for more realistic snippets
    const productHint = query.split(" ").slice(0, 2).join(" ");

    return shuffled.slice(0, Math.min(maxResults, 5)).map((c) => ({
      title: `${c.name} - Leading ${productHint} Manufacturer & Supplier`,
      url: `https://www.${c.domain}`,
      snippet: `${c.name} is a trusted manufacturer based in ${c.country}. Specializing in ${productHint.toLowerCase()} products with ISO certifications. Factory direct pricing, OEM/ODM available. MOQ from 100 units.`,
    }));
  }
}

// ─── Factory ──────────────────────────────────────────────────

export function createSearchProvider(): SearchProvider {
  if (process.env.SERP_API_KEY) {
    return new SerpApiProvider(process.env.SERP_API_KEY);
  }
  return new MockSearchProvider();
}
