import { NavLink } from 'react-router-dom';
import { Home, FileText, Bell, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fa } from '../../i18n/fa';
import { useUnreadNotifications } from '../../lib/use-unread';

export function BottomNav() {
  const { user } = useAuth();
  const isManager = user?.role === 'manager';
  const unread = useUnreadNotifications();

  const items: { to: string; icon: typeof Home; label: string; end?: boolean; badge?: number }[] = [
    { to: '/', icon: Home, label: isManager ? fa.dashboard.title : fa.nav.home, end: true },
    { to: '/requests', icon: FileText, label: fa.nav.requests },
    { to: '/notifications', icon: Bell, label: fa.nav.notifications, badge: unread },
  ];
  if (isManager) {
    items.push({ to: '/users', icon: Users, label: fa.nav.users });
  }

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 border-t border-border safe-bottom">
      <ul className="grid grid-cols-4">
        {items.map(({ to, icon: Icon, label, end, badge }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center gap-0.5 py-2.5 px-1 text-[11px] font-medium transition-colors ${
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className="relative">
                    <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} strokeWidth={isActive ? 2.4 : 1.8} />
                    {badge !== undefined && badge > 0 && (
                      <span className="absolute -top-1 -end-1.5 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full px-1 min-w-[16px] h-[16px] flex items-center justify-center leading-none">
                        {badge > 9 ? '۹+' : badge.toLocaleString('fa-IR')}
                      </span>
                    )}
                  </span>
                  <span className="truncate max-w-full">{label}</span>
                  {isActive && (
                    <span className="absolute top-0 inset-x-6 h-0.5 bg-primary rounded-full" />
                  )}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
