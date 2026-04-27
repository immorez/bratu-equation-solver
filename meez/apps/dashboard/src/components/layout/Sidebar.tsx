import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Calendar, Users, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
import { useUIStore } from '@/stores/ui.store';
import { useAuthStore } from '@/stores/auth.store';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/meetings', icon: Calendar, label: 'Meetings' },
];

const adminItems = [
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
];

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const user = useAuthStore((s) => s.user);

  return (
    <aside className={cn(
      'fixed left-0 top-0 h-full bg-card border-r border-border transition-all z-30',
      sidebarOpen ? 'w-64' : 'w-16',
    )}>
      <div className="flex items-center justify-between p-4 border-b border-border">
        {sidebarOpen && <span className="text-lg font-semibold">MeetAI</span>}
        <button onClick={toggleSidebar} className="p-1 rounded-md hover:bg-accent">
          {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
      <nav className="p-2 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
              isActive ? 'bg-accent text-foreground font-medium' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {sidebarOpen && <span>{item.label}</span>}
          </NavLink>
        ))}
        {user?.role === 'ADMIN' && (
          <>
            {sidebarOpen && <p className="px-3 pt-4 pb-1 text-xs font-medium text-muted-foreground uppercase">Admin</p>}
            {adminItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                  isActive ? 'bg-accent text-foreground font-medium' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </NavLink>
            ))}
          </>
        )}
      </nav>
    </aside>
  );
}
