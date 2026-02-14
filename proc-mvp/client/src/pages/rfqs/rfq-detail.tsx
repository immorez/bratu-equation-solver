import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  DollarSign,
  Trophy,
} from "lucide-react";
import { rfqApi, quoteApi } from "@/lib/api";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import type { Rfq, VendorComparison } from "@/types";

export default function RfqDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: rfq, isLoading } = useQuery<Rfq>({
    queryKey: ["rfq", id],
    queryFn: () => rfqApi.get(id!).then((r) => r.data),
    enabled: !!id,
  });

  const { data: comparison } = useQuery<{
    rfq: Rfq;
    comparison: VendorComparison[] | null;
  }>({
    queryKey: ["rfq", id, "compare"],
    queryFn: () => quoteApi.compare(id!).then((r) => r.data),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (!rfq) return <p className="text-gray-500">RFQ not found.</p>;

  return (
    <div className="space-y-6">
      <Link
        to="/rfqs"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to RFQs
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {rfq.rfqNumber}
          </h1>
          <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {rfq.deliveryLocation}
            </span>
            {rfq.requiredDeliveryDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(rfq.requiredDeliveryDate)}
              </span>
            )}
            {rfq.budgetMax && (
              <span className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                {formatCurrency(rfq.budgetMax, rfq.budgetCurrency)}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={rfq.priority} />
          <StatusBadge status={rfq.status} />
        </div>
      </div>

      {/* Line Items */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Requested Products
        </h2>
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="pb-3 text-left text-xs font-medium uppercase text-gray-500">
                Product
              </th>
              <th className="pb-3 text-left text-xs font-medium uppercase text-gray-500">
                Quantity
              </th>
              <th className="pb-3 text-left text-xs font-medium uppercase text-gray-500">
                Specifications
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rfq.lineItems.map((li) => (
              <tr key={li.id}>
                <td className="py-3 text-sm font-medium text-gray-900">
                  {li.productName}
                </td>
                <td className="py-3 text-sm text-gray-500">
                  {li.quantity.toLocaleString()} {li.unit}
                </td>
                <td className="py-3 text-sm text-gray-500">
                  {li.specifications
                    ? Object.entries(li.specifications)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(", ")
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Quality & Notes */}
      {(rfq.qualityRequirements.length > 0 || rfq.notes) && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          {rfq.qualityRequirements.length > 0 && (
            <div className="mb-4">
              <h3 className="mb-2 text-sm font-medium text-gray-700">
                Quality Requirements
              </h3>
              <div className="flex flex-wrap gap-2">
                {rfq.qualityRequirements.map((req) => (
                  <span
                    key={req}
                    className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                  >
                    {req}
                  </span>
                ))}
              </div>
            </div>
          )}
          {rfq.notes && (
            <div>
              <h3 className="mb-2 text-sm font-medium text-gray-700">
                Notes
              </h3>
              <p className="text-sm text-gray-500">{rfq.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Vendor Comparison */}
      {comparison?.comparison && comparison.comparison.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Trophy className="h-5 w-5 text-amber-500" />
            Vendor Comparison
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="pb-3 text-left text-xs font-medium uppercase text-gray-500">
                    Rank
                  </th>
                  <th className="pb-3 text-left text-xs font-medium uppercase text-gray-500">
                    Vendor
                  </th>
                  <th className="pb-3 text-left text-xs font-medium uppercase text-gray-500">
                    Price
                  </th>
                  <th className="pb-3 text-left text-xs font-medium uppercase text-gray-500">
                    Quality
                  </th>
                  <th className="pb-3 text-left text-xs font-medium uppercase text-gray-500">
                    Lead Time
                  </th>
                  <th className="pb-3 text-left text-xs font-medium uppercase text-gray-500">
                    Reliability
                  </th>
                  <th className="pb-3 text-left text-xs font-medium uppercase text-gray-500">
                    Score
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {comparison.comparison.map((vc, idx) => (
                  <tr
                    key={vc.quoteId}
                    className={cn(idx === 0 && "bg-amber-50/50")}
                  >
                    <td className="py-3 text-sm font-medium text-gray-500">
                      {idx === 0 ? "🏆" : `#${idx + 1}`}
                    </td>
                    <td className="py-3">
                      <p className="text-sm font-medium text-gray-900">
                        {vc.vendorName}
                      </p>
                      <p className="text-xs text-gray-400">{vc.country}</p>
                    </td>
                    <td className="py-3 text-sm text-gray-700">
                      {formatCurrency(vc.totalPrice)}
                    </td>
                    <td className="py-3 text-sm text-gray-700">
                      {vc.qualityScore.toFixed(1)}/10
                    </td>
                    <td className="py-3 text-sm text-gray-700">
                      {vc.leadTimeDays} days
                    </td>
                    <td className="py-3 text-sm text-gray-700">
                      {vc.reliabilityScore.toFixed(1)}/10
                    </td>
                    <td className="py-3">
                      <span
                        className={cn(
                          "text-sm font-bold",
                          idx === 0
                            ? "text-amber-600"
                            : "text-gray-700",
                        )}
                      >
                        {vc.finalScore.toFixed(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No quotes yet */}
      {(!comparison?.comparison || comparison.comparison.length === 0) && (
        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center">
          <p className="text-sm text-gray-400">
            No quotes received yet for this RFQ.
          </p>
        </div>
      )}
    </div>
  );
}
