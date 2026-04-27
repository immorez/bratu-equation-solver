export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  MEETINGS: '/meetings',
  MEETING_NEW: '/meetings/new',
  MEETING_DETAIL: (id: string) => `/meetings/${id}`,
  MEETING_LIVE: (id: string) => `/meetings/${id}/live`,
  ADMIN_USERS: '/admin/users',
  ADMIN_ANALYTICS: '/admin/analytics',
} as const;
