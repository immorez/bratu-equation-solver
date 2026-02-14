import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Plus, FileText } from "lucide-react";
import { rfqApi } from "@/lib/api";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate, formatCurrency } from "@/lib/utils";
import type { Rfq, PaginatedResponse } from "@/types";

export default function RfqListPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");

  const { data, isLoading } = useQuery<PaginatedResponse<Rfq>>({
    queryKey: ["rfqs", { page, status: statusFilter }],
    queryFn: () =>
      rfqApi
        .list({
          page,
          limit: 20,
          status: statusFilter || undefined,
        })
        .then((r) => r.data),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Requests for Quotation
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your RFQs and track quotes
          </p>
        </div>
        <Link
          to="/rfqs/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          Create RFQ
        </Link>
      </div>

      {/* Filter */}
      <div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
        >
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="SENT">Sent</option>
          <option value="QUOTING">Quoting</option>
          <option value="NEGOTIATING">Negotiating</option>
          <option value="COMPARING">Comparing</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                RFQ #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Products
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Budget
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Quotes
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Created
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-12 text-center text-sm text-gray-400"
                >
                  Loading...
                </td>
              </tr>
            )}
            {data?.data.length === 0 && !isLoading && (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-12 text-center text-sm text-gray-400"
                >
                  <FileText className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                  No RFQs found
                </td>
              </tr>
            )}
            {data?.data.map((rfq) => (
              <tr key={rfq.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <Link
                    to={`/rfqs/${rfq.id}`}
                    className="text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    {rfq.rfqNumber}
                  </Link>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {rfq.lineItems
                    ?.map((li) => li.productName)
                    .join(", ")
                    .slice(0, 50) || "—"}
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={rfq.status} />
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={rfq.priority} />
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {rfq.budgetMax
                    ? formatCurrency(rfq.budgetMax, rfq.budgetCurrency)
                    : "—"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {rfq._count?.quotes ?? 0}
                </td>
                <td className="px-6 py-4 text-sm text-gray-400">
                  {formatDate(rfq.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {(page - 1) * 20 + 1}–
            {Math.min(page * 20, data.pagination.total)} of{" "}
            {data.pagination.total}
          </p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <button
              disabled={page >= data.pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
