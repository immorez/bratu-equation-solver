// ─── User ────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "BUYER" | "VIEWER";
}

// ─── Vendor ──────────────────────────────────────────────────
export interface Vendor {
  id: string;
  companyName: string;
  country: string;
  website?: string;
  address?: string;
  companySize?: string;
  yearsInBusiness?: number;
  manufacturingCapacity?: string;
  minimumOrderQuantity?: string;
  leadTime?: string;
  qualityScore: number;
  reliabilityScore: number;
  performanceScore: number;
  responseRate: number;
  status: VendorStatus;
  discoveryDate: string;
  lastContact?: string;
  createdAt: string;
  updatedAt: string;
  contacts: VendorContact[];
  certifications: VendorCertification[];
  products: VendorProduct[];
  _count?: { quotes: number; communications: number };
}

export type VendorStatus = "DISCOVERED" | "CONTACTED" | "ACTIVE" | "INACTIVE";

export interface VendorContact {
  id: string;
  vendorId: string;
  type: string;
  value: string;
}

export interface VendorCertification {
  id: string;
  vendorId: string;
  name: string;
  issuedBy?: string;
  validUntil?: string;
}

export interface VendorProduct {
  id: string;
  vendorId: string;
  productCategory: string;
  specifications?: Record<string, unknown>;
  priceRange?: { min?: number; max?: number };
  moq?: number;
}

// ─── RFQ ─────────────────────────────────────────────────────
export interface Rfq {
  id: string;
  rfqNumber: string;
  requestedById: string;
  requestedBy?: Pick<User, "id" | "name" | "email">;
  status: RfqStatus;
  priority: Priority;
  deliveryLocation: string;
  requiredDeliveryDate?: string;
  budgetMin?: number;
  budgetMax?: number;
  budgetCurrency: string;
  qualityRequirements: string[];
  paymentTermsPreference?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  lineItems: RfqLineItem[];
  quotes?: Quote[];
  _count?: { quotes: number };
}

export type RfqStatus =
  | "DRAFT"
  | "SENT"
  | "QUOTING"
  | "NEGOTIATING"
  | "COMPARING"
  | "COMPLETED"
  | "CANCELLED";

export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface RfqLineItem {
  id: string;
  rfqId: string;
  productName: string;
  specifications?: Record<string, unknown>;
  quantity: number;
  unit: string;
}

// ─── Quote ───────────────────────────────────────────────────
export interface Quote {
  id: string;
  rfqId: string;
  vendorId: string;
  vendor?: Vendor;
  rfq?: Rfq;
  unitPrice: number;
  totalPrice: number;
  currency: string;
  leadTimeDays: number;
  paymentTerms?: string;
  notes?: string;
  status: QuoteStatus;
  receivedAt: string;
  validUntil?: string;
}

export type QuoteStatus =
  | "RECEIVED"
  | "UNDER_REVIEW"
  | "NEGOTIATING"
  | "ACCEPTED"
  | "REJECTED";

// ─── Dashboard ───────────────────────────────────────────────
export interface DashboardStats {
  vendors: {
    total: number;
    active: number;
    discovered: number;
    contacted: number;
  };
  rfqs: {
    total: number;
    active: number;
    completed: number;
  };
  quotes: {
    total: number;
    avgPerRfq: number;
  };
}

// ─── Comparison ──────────────────────────────────────────────
export interface VendorComparison {
  quoteId: string;
  vendorId: string;
  vendorName: string;
  country: string;
  totalPrice: number;
  unitPrice: number;
  leadTimeDays: number;
  qualityScore: number;
  reliabilityScore: number;
  certifications: string[];
  paymentTerms?: string;
  finalScore: number;
}

// ─── Pagination ──────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─── Discovery ───────────────────────────────────────────────
export type DiscoveryJobStatus =
  | "PENDING"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export interface DiscoveryJob {
  id: string;
  status: DiscoveryJobStatus;
  need?: string;
  productCategories: string[];
  targetCountries: string[];
  searchQueries: string[];
  maxVendorsPerQuery: number;
  autoImport: boolean;
  autoImportThreshold: number;
  discoveryMode: string;
  totalFound: number;
  totalNew: number;
  totalSkipped: number;
  totalImported: number;
  progress: number;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  isRunning?: boolean;
  _count?: { results: number };
}

export interface DiscoveryProduct {
  id: string;
  jobId: string;
  productCategory: string;
  name: string;
  description?: string;
  price: number;
  priceCurrency: string;
  source: string;
  sourceUrl?: string;
  sourceVendor?: string;
  resultId?: string;
  alternativeGroup?: string;
  result?: {
    id: string;
    companyName: string;
    website?: string;
    country?: string;
  };
}

export interface DiscoveryResult {
  id: string;
  jobId: string;
  companyName: string;
  country?: string;
  website?: string;
  email?: string;
  phone?: string;
  vendorId?: string;
  description?: string;
  productCategories: string[];
  certifications: string[];
  companySize?: string;
  yearsInBusiness?: number;
  source: string;
  confidence: number;
  imported: boolean;
  skipped: boolean;
  skipReason?: string;
  /** Price discovery from SerpAPI Google Shopping */
  priceMin?: number;
  priceMax?: number;
  priceCurrency?: string;
  priceDiscovery?: unknown;
  createdAt: string;
}

export interface DiscoveryJobDetail extends DiscoveryJob {
  results: DiscoveryResult[];
  summary: {
    imported: number;
    available: number;
    skipped: number;
  };
  products?: DiscoveryProduct[];
  productsByAlternatives?: Record<string, DiscoveryProduct[]>;
}

export interface DiscoveryStatus {
  mode: string;
  activeInMemory: number;
  jobs: { total: number; running: number; completed: number };
  results: { total: number; imported: number };
  capabilities: { openai: boolean; serpapi: boolean };
}
