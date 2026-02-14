import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/lib/api";
import type { DashboardStats } from "@/types";

export default function AnalyticsPage() {
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["dashboard", "stats"],
    queryFn: () => dashboardApi.stats().then((r) => r.data),
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">
          Insights into your sourcing performance
        </p>
      </div>

      {/* Vendor Funnel */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-gray-900">
          Vendor Pipeline
        </h2>
        <div className="flex items-end gap-6">
          <FunnelBar
            label="Discovered"
            value={stats?.vendors.discovered ?? 0}
            max={stats?.vendors.total ?? 1}
            color="bg-blue-500"
          />
          <FunnelBar
            label="Contacted"
            value={stats?.vendors.contacted ?? 0}
            max={stats?.vendors.total ?? 1}
            color="bg-yellow-500"
          />
          <FunnelBar
            label="Active"
            value={stats?.vendors.active ?? 0}
            max={stats?.vendors.total ?? 1}
            color="bg-green-500"
          />
        </div>
      </div>

      {/* RFQ stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <MetricCard
          label="RFQ Completion Rate"
          value={
            stats && stats.rfqs.total > 0
              ? `${Math.round((stats.rfqs.completed / stats.rfqs.total) * 100)}%`
              : "—"
          }
          description="Completed vs total RFQs"
        />
        <MetricCard
          label="Avg Quotes per RFQ"
          value={stats?.quotes.avgPerRfq?.toFixed(1) ?? "—"}
          description="Number of vendor responses"
        />
        <MetricCard
          label="Active RFQs"
          value={stats?.rfqs.active ?? 0}
          description="Currently in progress"
        />
      </div>

      <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center">
        <p className="text-sm text-gray-400">
          More detailed charts and analytics will be available as data
          accumulates.
        </p>
      </div>
    </div>
  );
}

function FunnelBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const height = max > 0 ? Math.max((value / max) * 200, 20) : 20;
  return (
    <div className="flex flex-1 flex-col items-center gap-2">
      <span className="text-lg font-bold text-gray-900">{value}</span>
      <div
        className={`w-full rounded-t-lg ${color} transition-all`}
        style={{ height }}
      />
      <span className="text-sm text-gray-500">{label}</span>
    </div>
  );
}

function MetricCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string | number;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
      <p className="mt-1 text-xs text-gray-400">{description}</p>
    </div>
  );
}
