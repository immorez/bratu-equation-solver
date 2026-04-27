import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CheckCheck, Bell, ArrowLeft, Loader2 } from 'lucide-react';
import api from '../../lib/api-client';
import { fa } from '../../i18n/fa';
import { formatJalaliDateTime } from '../../lib/utils';
import { EmptyState } from '../dashboard/DashboardPage';

export function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then((r) => r.data),
  });

  const markAll = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
    },
  });

  const markOne = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="ms-2 text-sm">{fa.common.loading}</span>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg md:text-xl font-bold text-foreground">{fa.notifications.title}</h2>
        {data?.unreadCount > 0 && (
          <button
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:bg-primary/10 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            {fa.notifications.markAllRead}
          </button>
        )}
      </div>

      {data?.notifications?.length === 0 ? (
        <div className="bg-card rounded-xl border border-border">
          <EmptyState
            icon={Bell}
            title={fa.notifications.empty}
            description={fa.notifications.emptyDesc}
          />
        </div>
      ) : (
        <ul className="space-y-2">
          {data?.notifications?.map((n: any) => (
            <li key={n.id}>
              <div
                onClick={() => !n.isRead && markOne.mutate(n.id)}
                className={`relative p-3.5 md:p-4 rounded-xl border transition-all ${
                  n.isRead
                    ? 'bg-card border-border'
                    : 'bg-primary/5 border-primary/20 cursor-pointer hover:bg-primary/10'
                }`}
              >
                {!n.isRead && (
                  <span className="absolute top-4 end-4 w-2 h-2 rounded-full bg-primary" aria-hidden />
                )}
                <div className="flex gap-2.5">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    n.isRead ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'
                  }`}>
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0 pe-4">
                    <p className={`text-sm leading-relaxed ${n.isRead ? 'text-muted-foreground' : 'text-foreground'}`}>
                      {n.message}
                    </p>
                    <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
                      <span className="text-[11px] text-muted-foreground">
                        {formatJalaliDateTime(n.createdAt)}
                      </span>
                      {n.requestId && (
                        <Link
                          to={`/requests/${n.requestId}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          {fa.request.viewRequest}
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
