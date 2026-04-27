import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, LogOut, Calendar, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useUnreadNotifications } from '../../lib/use-unread';
import { getCurrentJalaliDate, getCurrentTime } from '../../lib/utils';
import { fa } from '../../i18n/fa';

const titles: Record<string, string> = {
  '/': fa.nav.home,
  '/requests': fa.nav.requests,
  '/requests/new': fa.request.newRequest,
  '/notifications': fa.notifications.title,
  '/users': fa.nav.users,
};

function getPageTitle(pathname: string, isManager: boolean): string {
  if (pathname === '/') return isManager ? fa.dashboard.title : fa.nav.home;
  if (pathname.startsWith('/requests/') && pathname !== '/requests/new') {
    return fa.request.detail;
  }
  return titles[pathname] || fa.app.title;
}

export function Header() {
  const { user, logout } = useAuth();
  const isManager = user?.role === 'manager';
  const { pathname } = useLocation();
  const [time, setTime] = useState(getCurrentTime());
  const [date] = useState(getCurrentJalaliDate());

  useEffect(() => {
    const interval = setInterval(() => setTime(getCurrentTime()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const unread = useUnreadNotifications();
  const pageTitle = getPageTitle(pathname, isManager);

  return (
    <header className="sticky top-0 z-30 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 border-b border-border safe-top">
      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between gap-3 px-4 h-14">
        <div className="flex items-center gap-2.5 min-w-0">
          <img src="/favicon.svg" alt="SAMED logo" className="w-8 h-8 rounded-lg shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground leading-none mb-0.5">{fa.app.title}</p>
            <h1 className="text-sm font-bold text-foreground truncate leading-tight">{pageTitle}</h1>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Link
            to="/notifications"
            aria-label={fa.nav.notifications}
            className="relative inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted transition-colors"
          >
            <Bell className="w-5 h-5 text-foreground" strokeWidth={1.8} />
            {unread > 0 && (
              <span className="absolute top-1.5 start-1.5 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full px-1 min-w-[16px] h-[16px] flex items-center justify-center leading-none">
                {unread > 9 ? '۹+' : unread.toLocaleString('fa-IR')}
              </span>
            )}
          </Link>
          <button
            onClick={logout}
            aria-label={fa.nav.logout}
            className="inline-flex items-center justify-center w-10 h-10 rounded-full text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-5 h-5" strokeWidth={1.8} />
          </button>
        </div>
      </div>

      {/* Desktop header */}
      <div className="hidden md:flex items-center justify-between gap-4 px-6 h-16">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-bold text-foreground">{pageTitle}</h1>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>{date}</span>
          </span>
          <span className="w-px h-4 bg-border" />
          <span className="inline-flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{time}</span>
          </span>
        </div>
      </div>
    </header>
  );
}
