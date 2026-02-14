import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  FileText,
  MessageSquareQuote,
  TrendingUp,
} from "lucide-react";
import { dashboardApi } from "@/lib/api";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/utils";
import type { DashboardStats, Rfq, Vendor } from "@/types";

export default function DashboardPage() {
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["dashboard", "stats"],
    queryFn: () => dashboardApi.stats().then((r) => r.data),
  });

  const { data: recentRfqs } = useQuery<Rfq[]>({
    queryKey: ["dashboard", "recent-rfqs"],
    queryFn: () => dashboardApi.recentRfqs().then((r) => r.data),
  });

  const { data: recentVendors } = useQuery<Vendor[]>({
    queryKey: ["dashboard", "recent-vendors"],
    queryFn: () => dashboardApi.recentVendors().then((r) => r.data),
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your sourcing operations
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active RFQs"
          value={stats?.rfqs.active ?? 0}
          subtitle={`${stats?.rfqs.total ?? 0} total`}
          icon={FileText}
        />
        <StatCard
          title="Total Vendors"
          value={stats?.vendors.total ?? 0}
          subtitle={`${stats?.vendors.active ?? 0} active`}
          icon={Building2}
        />
        <StatCard
          title="Total Quotes"
          value={stats?.quotes.total ?? 0}
          subtitle={`${stats?.quotes.avgPerRfq ?? 0} avg per RFQ`}
          icon={MessageSquareQuote}
        />
        <StatCard
          title="Completed RFQs"
          value={stats?.rfqs.completed ?? 0}
          icon={TrendingUp}
        />
      </div>

      {/* Vendor Discovery Status */}
      {stats && stats.vendors.total > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Vendor Discovery Status
          </h2>
          <div className="mb-2 flex justify-between text-sm text-gray-600">
            <span>
              {stats.vendors.active} active of {stats.vendors.total} discovered
            </span>
            <span>
              {Math.round(
                (stats.vendors.active / stats.vendors.total) * 100,
              )}
              % conversion
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-primary-600 transition-all"
              style={{
                width: `${(stats.vendors.active / stats.vendors.total) * 100}%`,
              }}
            />
          </div>
          <div className="mt-3 flex gap-6 text-xs text-gray-500">
            <span>Discovered: {stats.vendors.discovered}</span>
            <span>Contacted: {stats.vendors.contacted}</span>
            <span>Active: {stats.vendors.active}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent RFQs */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent RFQs
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {recentRfqs?.length === 0 && (
              <p className="px-6 py-8 text-center text-sm text-gray-400">
                No RFQs yet. Create your first one.
              </p>
            )}
            {recentRfqs?.slice(0, 5).map((rfq) => (
              <div
                key={rfq.id}
                className="flex items-center justify-between px-6 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {rfq.rfqNumber}
                  </p>
                  <p className="text-xs text-gray-500">
                    {rfq.lineItems?.[0]?.productName ?? "No items"} &middot;{" "}
                    {rfq._count?.quotes ?? 0} quotes
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={rfq.status} />
                  <span className="text-xs text-gray-400">
                    {formatDate(rfq.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Vendors */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Vendors
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {recentVendors?.length === 0 && (
              <p className="px-6 py-8 text-center text-sm text-gray-400">
                No vendors yet. Add your first vendor.
              </p>
            )}
            {recentVendors?.slice(0, 5).map((vendor) => (
              <div
                key={vendor.id}
                className="flex items-center justify-between px-6 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {vendor.companyName}
                  </p>
                  <p className="text-xs text-gray-500">{vendor.country}</p>
                </div>
                <StatusBadge status={vendor.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
