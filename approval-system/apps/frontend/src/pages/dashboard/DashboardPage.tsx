import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Clock3, CheckCircle2, FileText, ArrowLeft, Plus, Inbox } from 'lucide-react';
import api from '../../lib/api-client';
import { useAuth } from '../../context/AuthContext';
import { fa } from '../../i18n/fa';
import { formatJalaliDateTime } from '../../lib/utils';
import { StatusBadge } from '../../components/ui/StatusBadge';

export { StatusBadge } from '../../components/ui/StatusBadge';

export function DashboardPage() {
  const { user } = useAuth();
  const isManager = user?.role === 'manager';

  const { data: metrics } = useQuery({
    queryKey: ['metrics'],
    queryFn: () => api.get('/requests/metrics').then((r) => r.data),
    enabled: isManager,
  });

  const { data: recentPending } = useQuery({
    queryKey: ['requests', 'pending-recent'],
    queryFn: () => api.get('/requests', { params: { status: 'pending', limit: 5 } }).then((r) => r.data),
    enabled: isManager,
  });

  const { data: myRequests } = useQuery({
    queryKey: ['requests', 'my-recent'],
    queryFn: () => api.get('/requests', { params: { limit: 5 } }).then((r) => r.data),
    enabled: !isManager,
  });

  const greetingName = user?.name?.split(' ')[0] || '';

  if (isManager) {
    return (
      <div className="space-y-5 max-w-6xl mx-auto">
        <div>
          <p className="text-xs text-muted-foreground">{fa.dashboard.welcomeBack}</p>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">{greetingName} 👋</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          <StatCard
            label={fa.dashboard.pending}
            value={metrics?.pending}
            Icon={Clock3}
            tone="warning"
          />
          <StatCard
            label={fa.dashboard.approvedToday}
            value={metrics?.approvedToday}
            Icon={CheckCircle2}
            tone="success"
          />
          <StatCard
            label={fa.dashboard.total}
            value={metrics?.total}
            Icon={FileText}
            tone="primary"
            className="col-span-2 md:col-span-1"
          />
        </div>

        <div className="bg-card rounded-xl border border-border shadow-soft overflow-hidden">
          <div className="flex items-center justify-between px-4 md:px-5 py-3.5 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">{fa.dashboard.latestPending}</h3>
            <Link
              to="/requests"
              className="text-xs text-primary hover:underline inline-flex items-center gap-1 font-medium"
            >
              {fa.dashboard.viewAll}
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentPending?.items?.length === 0 ? (
            <EmptyState icon={Inbox} title={fa.request.noRequests} compact />
          ) : (
            <ul className="divide-y divide-border">
              {recentPending?.items?.map((r: any) => (
                <li key={r.id}>
                  <Link
                    to={`/requests/${r.id}`}
                    className="flex items-center gap-3 px-4 md:px-5 py-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {r.createdBy?.name} · {formatJalaliDateTime(r.createdAt)}
                      </p>
                    </div>
                    <StatusBadge status={r.status} size="sm" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  // Employee home
  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">{fa.dashboard.welcomeBack}</p>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">{greetingName} 👋</h2>
        </div>
        <Link
          to="/requests/new"
          className="inline-flex items-center gap-1.5 px-3.5 md:px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs md:text-sm font-semibold hover:bg-primary/90 active:bg-primary/95 transition-colors shadow-soft whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>{fa.request.newRequest}</span>
        </Link>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-2.5">{fa.request.myRequests}</h3>
        {myRequests?.items?.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title={fa.request.noRequests}
            description={fa.request.noRequestsDesc}
            action={
              <Link
                to="/requests/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {fa.request.newRequest}
              </Link>
            }
          />
        ) : (
          <ul className="space-y-2">
            {myRequests?.items?.map((r: any) => (
              <li key={r.id}>
                <Link
                  to={`/requests/${r.id}`}
                  className="block bg-card rounded-xl border border-border p-3.5 md:p-4 hover:border-primary/30 hover:shadow-soft active:scale-[0.99] transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">{r.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatJalaliDateTime(r.createdAt)}
                      </p>
                    </div>
                    <StatusBadge status={r.status} size="sm" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  Icon,
  tone,
  className = '',
}: {
  label: string;
  value: number | undefined;
  Icon: typeof Clock3;
  tone: 'warning' | 'success' | 'primary';
  className?: string;
}) {
  const tones: Record<string, string> = {
    warning: 'text-warning bg-warning/10',
    success: 'text-success bg-success/10',
    primary: 'text-primary bg-primary/10',
  };
  const display = value === undefined ? '—' : value.toLocaleString('fa-IR');
  return (
    <div className={`bg-card rounded-xl border border-border p-4 md:p-5 shadow-soft ${className}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs md:text-sm text-muted-foreground font-medium">{label}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tones[tone]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl md:text-3xl font-bold mt-2 text-foreground">{display}</p>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  compact = false,
}: {
  icon: typeof Inbox;
  title: string;
  description?: string;
  action?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-8 px-4' : 'py-12 px-6'}`}>
      <div className="w-12 h-12 rounded-full bg-muted text-muted-foreground flex items-center justify-center mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {description && <p className="text-xs text-muted-foreground mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
