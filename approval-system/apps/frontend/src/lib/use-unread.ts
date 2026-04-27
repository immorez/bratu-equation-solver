import { useQuery } from '@tanstack/react-query';
import api from './api-client';

export function useUnreadNotifications(): number {
  const { data } = useQuery({
    queryKey: ['notifications-count'],
    queryFn: () => api.get('/notifications').then((r) => r.data),
    refetchInterval: 30_000,
  });
  return data?.unreadCount ?? 0;
}
