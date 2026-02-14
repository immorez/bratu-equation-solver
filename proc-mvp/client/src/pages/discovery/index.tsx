import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Search,
  Plus,
  Loader2,
  ChevronRight,
  Globe,
  Package,
  Zap,
} from "lucide-react";
import { discoveryApi } from "@/lib/api";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/utils";
import type {
  DiscoveryJob,
  DiscoveryStatus,
  PaginatedResponse,
} from "@/types";

const POLL_INTERVAL_MS = 2000;

function parseList(value: string): string[] {
  return value
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function DiscoveryPage() {
  const queryClient = useQueryClient();
  const [need, setNeed] = useState("");
  const [productCategories, setProductCategories] = useState("");
  const [targetCountries, setTargetCountries] = useState("");
  const [maxVendorsPerQuery, setMaxVendorsPerQuery] = useState(10);
  const [autoImport, setAutoImport] = useState(false);
  const [autoImportThreshold, setAutoImportThreshold] = useState(0.8);
  const [page, setPage] = useState(1);

  const { data: status } = useQuery<DiscoveryStatus>({
    queryKey: ["discovery", "status"],
    queryFn: () => discoveryApi.status().then((r) => r.data),
  });

  const {
    data: jobsData,
    isLoading: jobsLoading,
  } = useQuery<PaginatedResponse<DiscoveryJob> & { activeJobCount: number }>({
    queryKey: ["discovery", "jobs", page],
    queryFn: () =>
      discoveryApi.listJobs({ page, limit: 10 }).then((r) => r.data),
    refetchInterval: (query) => {
      const data = query.state.data;
      return data?.activeJobCount ? POLL_INTERVAL_MS : false;
    },
  });

  const createJob = useMutation({
    mutationFn: (input: {
      need?: string;
      productCategories: string[];
      targetCountries: string[];
      maxVendorsPerQuery: number;
      autoImport: boolean;
      autoImportThreshold: number;
    }) => discoveryApi.createJob(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discovery"] });
      setNeed("");
      setProductCategories("");
      setTargetCountries("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const categories = parseList(productCategories);
    const countries = parseList(targetCountries);
    if (!categories.length || !countries.length) return;
    createJob.mutate({
      need: need.trim() || undefined,
      productCategories: categories,
      targetCountries: countries,
      maxVendorsPerQuery,
      autoImport,
      autoImportThreshold,
    });
  };

  const jobs = jobsData?.data ?? [];
  const pagination = jobsData?.pagination;
  const hasActiveJobs = (jobsData?.activeJobCount ?? 0) > 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Vendor Discovery</h1>
        <p className="mt-1 text-sm text-gray-500">
          Find new vendors by product category and country. Jobs run in the
          background with real-time progress.
        </p>
      </div>

      {/* System status */}
      {status && (
        <div className="flex flex-wrap gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            <span className="text-sm font-medium text-gray-700">Mode:</span>
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
              {status.mode}
            </span>
          </div>
          <div className="text-sm text-gray-500">
            {status.jobs.running} running · {status.jobs.completed} completed
          </div>
          <div className="text-xs text-gray-400">
            OpenAI: {status.capabilities.openai ? "✓" : "—"} · SerpAPI:{" "}
            {status.capabilities.serpapi ? "✓" : "—"}
          </div>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Create job form */}
        <div className="lg:col-span-1">
          <div className="sticky top-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Plus className="h-5 w-5 text-primary-600" />
              New Discovery Job
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Need / requirement
                </label>
                <input
                  type="text"
                  value={need}
                  onChange={(e) => setNeed(e.target.value)}
                  placeholder="e.g. Office chairs for 50-person team"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                />
                <p className="mt-1 text-xs text-gray-400">
                  Optional: describes the procurement need
                </p>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Product categories
                </label>
                <input
                  type="text"
                  value={productCategories}
                  onChange={(e) => setProductCategories(e.target.value)}
                  placeholder="e.g. steel pipes, industrial valves, bearings"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                  required
                />
                <p className="mt-1 text-xs text-gray-400">
                  Comma or semicolon separated
                </p>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Target countries
                </label>
                <input
                  type="text"
                  value={targetCountries}
                  onChange={(e) => setTargetCountries(e.target.value)}
                  placeholder="e.g. Germany, China, USA"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                  required
                />
                <p className="mt-1 text-xs text-gray-400">
                  Comma or semicolon separated
                </p>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Max vendors per query
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={maxVendorsPerQuery}
                  onChange={(e) =>
                    setMaxVendorsPerQuery(Number(e.target.value) || 10)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="autoImport"
                  checked={autoImport}
                  onChange={(e) => setAutoImport(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="autoImport" className="text-sm text-gray-700">
                  Auto-import high-confidence results
                </label>
              </div>
              {autoImport && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Confidence threshold (0–1)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={1}
                    step={0.1}
                    value={autoImportThreshold}
                    onChange={(e) =>
                      setAutoImportThreshold(Number(e.target.value) || 0.8)
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                  />
                </div>
              )}
              <button
                type="submit"
                disabled={
                  createJob.isPending ||
                  !parseList(productCategories).length ||
                  !parseList(targetCountries).length
                }
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-50"
              >
                {createJob.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Starting…
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Start Discovery
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Job list */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Discovery Jobs
              </h2>
              {hasActiveJobs && (
                <span className="flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
                  Live
                </span>
              )}
            </div>
            <div className="divide-y divide-gray-100">
              {jobsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : jobs.length === 0 ? (
                <div className="py-16 text-center">
                  <Search className="mx-auto h-12 w-12 text-gray-300" />
                  <p className="mt-2 text-sm text-gray-500">
                    No discovery jobs yet. Create one to get started.
                  </p>
                </div>
              ) : (
                jobs.map((job) => (
                  <Link
                    key={job.id}
                    to={`/discovery/${job.id}`}
                    className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-gray-50"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50">
                        <Package className="h-5 w-5 text-primary-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {job.productCategories.slice(0, 2).join(", ")}
                            {job.productCategories.length > 2 &&
                              ` +${job.productCategories.length - 2}`}
                          </span>
                          <StatusBadge status={job.status} />
                          {(job.isRunning ?? job.status === "RUNNING") && (
                            <Loader2 className="h-4 w-4 animate-spin text-primary-600" />
                          )}
                        </div>
                        <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Globe className="h-3.5 w-3.5" />
                            {job.targetCountries.slice(0, 3).join(", ")}
                          </span>
                          <span>
                            {job.totalFound} found · {job.totalNew} new ·{" "}
                            {job.totalImported} imported
                          </span>
                        </div>
                        {(job.status === "RUNNING" || job.status === "PENDING") &&
                          job.progress !== undefined && (
                            <div className="mt-2">
                              <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                                <div
                                  className="h-full rounded-full bg-primary-600 transition-all"
                                  style={{
                                    width: `${Math.round(job.progress)}%`,
                                  }}
                                />
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      {formatDate(job.createdAt)}
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </Link>
                ))
              )}
            </div>
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3">
                <p className="text-sm text-gray-500">
                  Page {pagination.page} of {pagination.totalPages} (
                  {pagination.total} total)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setPage((p) =>
                        Math.min(pagination.totalPages, p + 1),
                      )
                    }
                    disabled={page >= pagination.totalPages}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
