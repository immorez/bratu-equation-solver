import { NavLink } from 'react-router-dom';
import { Home, FileText, Bell, Users, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fa } from '../../i18n/fa';
import { useUnreadNotifications } from '../../lib/use-unread';

export function Sidebar() {
  const { user, logout } = useAuth();
  const isManager = user?.role === 'manager';
  const unread = useUnreadNotifications();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
      isActive
        ? 'bg-primary text-primary-foreground shadow-soft'
        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
    }`;

  return (
    <aside className="hidden md:flex w-64 shrink-0 min-h-screen border-s border-border bg-card flex-col">
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <img src="/favicon.svg" alt="SAMED logo" className="w-9 h-9 rounded-lg shrink-0" />
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-foreground leading-tight truncate">{fa.app.title}</h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">{fa.app.subtitle}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <NavLink to="/" className={linkClass} end>
          <Home className="w-[18px] h-[18px] shrink-0" />
          <span>{isManager ? fa.dashboard.title : fa.nav.home}</span>
        </NavLink>
        <NavLink to="/requests" className={linkClass}>
          <FileText className="w-[18px] h-[18px] shrink-0" />
          <span>{isManager ? fa.request.allRequests : fa.request.myRequests}</span>
        </NavLink>
        <NavLink to="/notifications" className={linkClass}>
          <Bell className="w-[18px] h-[18px] shrink-0" />
          <span className="flex-1">{fa.nav.notifications}</span>
          {unread > 0 && (
            <span className="bg-destructive text-destructive-foreground text-[10px] font-semibold rounded-full px-1.5 min-w-[18px] h-[18px] flex items-center justify-center">
              {unread > 99 ? '۹۹+' : unread.toLocaleString('fa-IR')}
            </span>
          )}
        </NavLink>
        {isManager && (
          <NavLink to="/users" className={linkClass}>
            <Users className="w-[18px] h-[18px] shrink-0" />
            <span>{fa.nav.users}</span>
          </NavLink>
        )}
      </nav>

      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2.5 px-2 py-1.5 mb-2">
          <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-bold shrink-0">
            {user?.name?.charAt(0) || '؟'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">{user?.name}</p>
            <p className="text-[10px] text-muted-foreground">
              {isManager ? fa.users.manager : fa.users.employee}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-[18px] h-[18px]" />
          <span>{fa.nav.logout}</span>
        </button>
      </div>
    </aside>
  );
}
