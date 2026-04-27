import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, ChevronRight, ChevronLeft, Inbox, Loader2 } from 'lucide-react';
import api from '../../lib/api-client';
import { useAuth } from '../../context/AuthContext';
import { fa } from '../../i18n/fa';
import { formatJalaliDateTime, formatAmount } from '../../lib/utils';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { EmptyState } from '../dashboard/DashboardPage';

const statusFilters = ['', 'pending', 'approved', 'rejected', 'needs_revision', 'draft'] as const;

export function RequestsListPage() {
  const { user } = useAuth();
  const isManager = user?.role === 'manager';
  const [status, setStatus] = useState<string>('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['requests', status, page],
    queryFn: () =>
      api
        .get('/requests', { params: { status: status || undefined, page, limit: 20 } })
        .then((r) => r.data),
  });

  const totalPages = data ? Math.ceil(data.total / data.limit) : 1;

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg md:text-xl font-bold text-foreground">
          {isManager ? fa.request.allRequests : fa.request.myRequests}
        </h2>
        {!isManager && (
          <Link
            to="/requests/new"
            className="inline-flex items-center gap-1.5 px-3 md:px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs md:text-sm font-semibold hover:bg-primary/90 active:bg-primary/95 transition-colors shadow-soft whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{fa.request.newRequest}</span>
            <span className="sm:hidden">جدید</span>
          </Link>
        )}
      </div>

      {/* Filter chips - horizontal scroll on mobile */}
      <div className="-mx-4 md:mx-0 px-4 md:px-0 overflow-x-auto scrollbar-none">
        <div className="flex gap-2 min-w-max md:flex-wrap">
          {statusFilters.map((s) => (
            <button
              key={s || 'all'}
              onClick={() => {
                setStatus(s);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap border ${
                status === s
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground'
              }`}
            >
              {s === '' ? fa.status.all : (fa.status as Record<string, string>)[s]}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="ms-2 text-sm">{fa.common.loading}</span>
        </div>
      ) : data?.items?.length === 0 ? (
        <div className="bg-card rounded-xl border border-border">
          <EmptyState icon={Inbox} title={fa.request.noRequests} />
        </div>
      ) : (
        <>
          {/* Mobile: cards */}
          <ul className="md:hidden space-y-2">
            {data?.items?.map((r: any) => (
              <li key={r.id}>
                <Link
                  to={`/requests/${r.id}`}
                  className="block bg-card rounded-xl border border-border p-3.5 hover:border-primary/30 active:scale-[0.99] transition-all"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className="font-semibold text-sm text-foreground line-clamp-2 flex-1">{r.title}</p>
                    <StatusBadge status={r.status} size="sm" />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="truncate">
                      {isManager && r.createdBy?.name ? `${r.createdBy.name} · ` : ''}
                      {formatJalaliDateTime(r.createdAt)}
                    </span>
                    {r.amount != null && (
                      <span className="font-medium text-foreground shrink-0 ms-2">
                        {formatAmount(r.amount)}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop: table */}
          <div className="hidden md:block bg-card rounded-xl border border-border overflow-hidden shadow-soft">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-start px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                    {fa.request.title}
                  </th>
                  {isManager && (
                    <th className="text-start px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                      {fa.request.createdBy}
                    </th>
                  )}
                  <th className="text-start px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                    {fa.request.status}
                  </th>
                  <th className="text-start px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                    {fa.request.amount}
                  </th>
                  <th className="text-start px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                    {fa.request.createdAt}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data?.items?.map((r: any) => (
                  <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        to={`/requests/${r.id}`}
                        className="text-foreground hover:text-primary font-medium transition-colors"
                      >
                        {r.title}
                      </Link>
                    </td>
                    {isManager && (
                      <td className="px-4 py-3 text-muted-foreground">{r.createdBy?.name}</td>
                    )}
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums">
                      {formatAmount(r.amount)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {formatJalaliDateTime(r.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {data && data.total > data.limit && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            aria-label="صفحه قبلی"
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-card border border-border text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="px-3 py-1.5 text-xs text-muted-foreground tabular-nums">
            صفحه {page.toLocaleString('fa-IR')} از {totalPages.toLocaleString('fa-IR')}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages}
            aria-label="صفحه بعدی"
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-card border border-border text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
