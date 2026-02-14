import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  },
);

export default api;

// ─── Auth ────────────────────────────────────────────────────
export const authApi = {
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
  register: (data: { email: string; password: string; name: string }) =>
    api.post("/auth/register", data),
  me: () => api.get("/auth/me"),
};

// ─── Vendors ─────────────────────────────────────────────────
export const vendorApi = {
  list: (params?: Record<string, unknown>) => api.get("/vendors", { params }),
  get: (id: string) => api.get(`/vendors/${id}`),
  create: (data: Record<string, unknown>) => api.post("/vendors", data),
  update: (id: string, data: Record<string, unknown>) =>
    api.patch(`/vendors/${id}`, data),
  delete: (id: string) => api.delete(`/vendors/${id}`),
};

// ─── RFQs ────────────────────────────────────────────────────
export const rfqApi = {
  list: (params?: Record<string, unknown>) => api.get("/rfqs", { params }),
  get: (id: string) => api.get(`/rfqs/${id}`),
  create: (data: Record<string, unknown>) => api.post("/rfqs", data),
  update: (id: string, data: Record<string, unknown>) =>
    api.patch(`/rfqs/${id}`, data),
  delete: (id: string) => api.delete(`/rfqs/${id}`),
};

// ─── Quotes ──────────────────────────────────────────────────
export const quoteApi = {
  listByRfq: (rfqId: string) => api.get(`/quotes/rfq/${rfqId}`),
  get: (id: string) => api.get(`/quotes/${id}`),
  create: (data: Record<string, unknown>) => api.post("/quotes", data),
  updateStatus: (id: string, status: string) =>
    api.patch(`/quotes/${id}/status`, { status }),
  compare: (rfqId: string) => api.get(`/quotes/rfq/${rfqId}/compare`),
};

// ─── Dashboard ───────────────────────────────────────────────
export const dashboardApi = {
  stats: () => api.get("/dashboard/stats"),
  recentRfqs: () => api.get("/dashboard/recent-rfqs"),
  recentVendors: () => api.get("/dashboard/recent-vendors"),
};

// ─── Discovery ───────────────────────────────────────────────
export const discoveryApi = {
  status: () => api.get("/discovery/status"),
  createJob: (data: {
    need?: string;
    productCategories: string[];
    targetCountries: string[];
    maxVendorsPerQuery?: number;
    autoImport?: boolean;
    autoImportThreshold?: number;
  }) => api.post("/discovery/jobs", data),
  listJobs: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get("/discovery/jobs", { params }),
  getJob: (id: string) => api.get(`/discovery/jobs/${id}`),
  cancelJob: (id: string) => api.post(`/discovery/jobs/${id}/cancel`),
};

// ─── Outreach (contact extraction, email, WhatsApp) ────────────
export const outreachApi = {
  status: () => api.get("/outreach/status"),
  extractContacts: (resultId: string) =>
    api.post("/outreach/extract-contacts", { resultId }),
  send: (data: {
    vendorId?: string;
    resultId?: string;
    channel: "email" | "whatsapp";
    recipient?: string;
    customMessage?: string;
  }) => api.post("/outreach/send", data),
};
