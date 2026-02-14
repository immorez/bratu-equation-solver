import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowLeft,
  Loader2,
  Package,
  Globe,
  Building2,
  Check,
  X,
  ExternalLink,
  StopCircle,
  DollarSign,
  Mail,
  MessageCircle,
  Search,
  ShoppingBag,
} from "lucide-react";
import { discoveryApi, outreachApi } from "@/lib/api";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/utils";
import type { DiscoveryJobDetail } from "@/types";

const POLL_INTERVAL_MS = 2000;

export default function DiscoveryJobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [outreachResultId, setOutreachResultId] = useState<string | null>(null);

  const { data: outreachStatus } = useQuery({
    queryKey: ["outreach", "status"],
    queryFn: () => outreachApi.status().then((r) => r.data),
  });

  const {
    data: job,
    isLoading,
    error,
  } = useQuery<DiscoveryJobDetail>({
    queryKey: ["discovery", "job", id],
    queryFn: () => discoveryApi.getJob(id!).then((r) => r.data),
    enabled: !!id,
    refetchInterval: (query) => {
      const data = query.state.data;
      return data?.isRunning ?? data?.status === "RUNNING"
        ? POLL_INTERVAL_MS
        : false;
    },
  });

  const cancelJob = useMutation({
    mutationFn: () => discoveryApi.cancelJob(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discovery"] });
    },
  });

  const extractContacts = useMutation({
    mutationFn: (resultId: string) =>
      outreachApi.extractContacts(resultId).then((r) => r.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["discovery", "job", id] });
      setOutreachResultId(data.resultId);
    },
  });

  const sendOutreach = useMutation({
    mutationFn: (params: {
      resultId?: string;
      vendorId?: string;
      channel: "email" | "whatsapp";
      recipient?: string;
    }) => outreachApi.send(params).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discovery", "job", id] });
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
    },
  });

  if (!id) {
    return (
      <div className="text-center text-gray-500">Invalid job ID</div>
    );
  }

  if (isLoading || !job) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
        Failed to load job.{" "}
        <Link to="/discovery" className="underline">
          Back to discovery
        </Link>
      </div>
    );
  }

  const isRunning = job.isRunning ?? job.status === "RUNNING";
  const canCancel =
    job.status === "RUNNING" || job.status === "PENDING";
  const availableResults = job.results?.filter(
    (r) => !r.imported && !r.skipped,
  ) ?? [];
  const importedResults = job.results?.filter((r) => r.imported) ?? [];
  const skippedResults = job.results?.filter((r) => r.skipped) ?? [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Link
          to="/discovery"
          className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Discovery
        </Link>
        {canCancel && (
          <button
            onClick={() => cancelJob.mutate()}
            disabled={cancelJob.isPending}
            className="flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            {cancelJob.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <StopCircle className="h-4 w-4" />
            )}
            Cancel Job
          </button>
        )}
      </div>

      {/* Header */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-50">
              <Package className="h-7 w-7 text-primary-600" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-gray-900">
                  {job.productCategories.join(", ")}
                </h1>
                <StatusBadge status={job.status} />
                {isRunning && (
                  <span className="flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
                    Live
                  </span>
                )}
              </div>
              {job.need && (
                <p className="mt-2 text-sm text-gray-600">
                  <span className="font-medium text-gray-700">Need:</span>{" "}
                  {job.need}
                </p>
              )}
              <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Globe className="h-4 w-4" />
                  {job.targetCountries.join(", ")}
                </span>
                <span>Mode: {job.discoveryMode}</span>
                <span>Created {formatDate(job.createdAt)}</span>
                {outreachStatus && (
                  <span className="text-xs text-gray-400">
                    Email: {outreachStatus.email ? "✓" : "—"} · WhatsApp:{" "}
                    {outreachStatus.whatsapp ? "✓" : "—"}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {(job.status === "RUNNING" || job.status === "PENDING") && (
          <div className="mt-6">
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium text-gray-900">
                {Math.round(job.progress)}%
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-primary-600 transition-all duration-500"
                style={{ width: `${job.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-500">Found</p>
            <p className="text-2xl font-bold text-gray-900">{job.totalFound}</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-500">New</p>
            <p className="text-2xl font-bold text-gray-900">{job.totalNew}</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-500">Imported</p>
            <p className="text-2xl font-bold text-green-600">
              {job.totalImported}
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-500">Skipped</p>
            <p className="text-2xl font-bold text-gray-600">
              {job.totalSkipped}
            </p>
          </div>
        </div>

        {job.error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {job.error}
          </div>
        )}
      </div>

      {/* Results */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Discovery Results ({job.results?.length ?? 0})
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {job.summary?.available ?? availableResults.length} available ·{" "}
            {job.summary?.imported ?? importedResults.length} imported ·{" "}
            {job.summary?.skipped ?? skippedResults.length} skipped
          </p>
        </div>
        <div className="divide-y divide-gray-100">
          {!job.results?.length ? (
            <div className="py-16 text-center">
              {isRunning ? (
                <>
                  <Loader2 className="mx-auto h-10 w-10 animate-spin text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">
                    Discovering vendors… results will appear here in real time.
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-500">
                  No results for this job.
                </p>
              )}
            </div>
          ) : (
            job.results.map((result) => (
              <div
                key={result.id}
                className="flex items-start justify-between gap-4 px-6 py-4"
              >
                <div className="flex min-w-0 flex-1 gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                    <Building2 className="h-5 w-5 text-gray-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">
                        {result.companyName}
                      </p>
                      {result.imported && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                          <Check className="h-3 w-3" />
                          Imported
                        </span>
                      )}
                      {result.skipped && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                          <X className="h-3 w-3" />
                          Skipped
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                      {result.country && <span>{result.country}</span>}
                      {result.website && (
                        <a
                          href={
                            result.website.startsWith("http")
                              ? result.website
                              : `https://${result.website}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary-600 hover:underline"
                        >
                          {result.website}
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                      {result.email && <span>{result.email}</span>}
                      {result.phone && (
                        <span className="flex items-center gap-1">
                          {result.phone}
                        </span>
                      )}
                    </div>
                    {result.productCategories?.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {result.productCategories.map((cat) => (
                          <span
                            key={cat}
                            className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    )}
                    {(result.priceMin != null || result.priceMax != null) && (
                      <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800">
                        <DollarSign className="h-3.5 w-3.5" />
                        <span>
                          {result.priceMin != null && result.priceMax != null
                            ? `${result.priceCurrency ?? "USD"} ${result.priceMin.toLocaleString()}–${result.priceMax.toLocaleString()}`
                            : result.priceMin != null
                              ? `from ${result.priceCurrency ?? "USD"} ${result.priceMin.toLocaleString()}`
                              : `up to ${result.priceCurrency ?? "USD"} ${result.priceMax!.toLocaleString()}`}
                        </span>
                        <span className="text-emerald-600">(SERP)</span>
                      </div>
                    )}
                    {result.skipped && result.skipReason && (
                      <p className="mt-1 text-xs text-gray-500">
                        {result.skipReason}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  {!result.imported && !result.skipped && (
                    <span className="text-xs text-gray-400">
                      {(result.confidence * 100).toFixed(0)}% confidence
                    </span>
                  )}
                  {!result.skipped && (
                    <div className="flex flex-wrap gap-1.5">
                      {result.website && !result.email && !result.phone && (
                        <button
                          onClick={() => extractContacts.mutate(result.id)}
                          disabled={extractContacts.isPending}
                          className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                          title="Extract email/phone from website"
                        >
                          {extractContacts.isPending &&
                          outreachResultId === result.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Search className="h-3 w-3" />
                          )}
                          Extract
                        </button>
                      )}
                      {(result.email || result.vendorId) &&
                        outreachStatus?.email && (
                          <button
                            onClick={() =>
                              sendOutreach.mutate({
                                resultId: result.vendorId ? undefined : result.id,
                                vendorId: result.vendorId ?? undefined,
                                channel: "email",
                                recipient: result.email,
                              })
                            }
                            disabled={
                              sendOutreach.isPending ||
                              (!result.email && !result.vendorId)
                            }
                            className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                            title="Send introduction email"
                          >
                            <Mail className="h-3 w-3" />
                            Email
                          </button>
                        )}
                      {(result.phone || result.vendorId) &&
                        outreachStatus?.whatsapp && (
                          <button
                            onClick={() =>
                              sendOutreach.mutate({
                                resultId: result.vendorId ? undefined : result.id,
                                vendorId: result.vendorId ?? undefined,
                                channel: "whatsapp",
                                recipient: result.phone,
                              })
                            }
                            disabled={
                              sendOutreach.isPending ||
                              (!result.phone && !result.vendorId)
                            }
                            className="inline-flex items-center gap-1 rounded-md border border-green-200 bg-green-50 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50"
                            title="Send WhatsApp message"
                          >
                            <MessageCircle className="h-3 w-3" />
                            WhatsApp
                          </button>
                        )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Products & Alternatives */}
      {job.products && job.products.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <ShoppingBag className="h-5 w-5 text-primary-600" />
              Products & Alternatives ({job.products.length})
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Products discovered from SERP and vendors, grouped by alternatives
            </p>
          </div>
          <div className="divide-y divide-gray-100">
            {job.productsByAlternatives &&
            Object.keys(job.productsByAlternatives).length > 0 ? (
              Object.entries(job.productsByAlternatives).map(
                ([groupKey, products]) => {
                  const [category, country] = groupKey.split("|");
                  return (
                    <div key={groupKey} className="px-6 py-4">
                      <h3 className="mb-3 text-sm font-medium text-gray-700">
                        {category}
                        {country && (
                          <span className="ml-2 text-gray-500">
                            ({country})
                          </span>
                        )}
                      </h3>
                      <div className="space-y-2">
                        {products.map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/50 px-4 py-3"
                          >
                            <div>
                              <p className="font-medium text-gray-900">
                                {p.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {p.sourceVendor && (
                                  <span>{p.sourceVendor}</span>
                                )}
                                {p.source && (
                                  <span className="ml-2 capitalize">
                                    · {p.source}
                                  </span>
                                )}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">
                                {p.priceCurrency}{" "}
                                {p.price.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                })}
                              </p>
                              {p.sourceUrl && (
                                <a
                                  href={p.sourceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary-600 hover:underline"
                                >
                                  View
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                },
              )
            ) : (
              <div className="space-y-2 px-6 py-4">
                {job.products.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/50 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-500">
                        {p.sourceVendor && <span>{p.sourceVendor}</span>}
                        {p.source && (
                          <span className="ml-2 capitalize">· {p.source}</span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {p.priceCurrency}{" "}
                        {p.price.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                      {p.sourceUrl && (
                        <a
                          href={p.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary-600 hover:underline"
                        >
                          View
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
