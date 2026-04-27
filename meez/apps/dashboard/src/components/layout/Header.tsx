import { useAuthStore } from '@/stores/auth.store';
import { LogOut, User } from 'lucide-react';

export default function Header() {
  const { user, logout } = useAuthStore();

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="w-4 h-4" />
          <span>{user?.email}</span>
        </div>
        <button onClick={logout} className="p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="Logout">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
