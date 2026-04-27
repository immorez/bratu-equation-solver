import { useState, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Loader2, AlertCircle, X, Users as UsersIcon, ShieldCheck, User } from 'lucide-react';
import api from '../../lib/api-client';
import { fa } from '../../i18n/fa';
import { EmptyState } from '../dashboard/DashboardPage';

export function UsersPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: () => api.post('/users', { name, email, password, role: 'employee' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowForm(false);
      setName('');
      setEmail('');
      setPassword('');
      setError('');
    },
    onError: (err: any) => {
      setError(err.response?.data?.error?.message || fa.common.error);
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    createMutation.mutate();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg md:text-xl font-bold text-foreground">{fa.users.title}</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-1.5 px-3 md:px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs md:text-sm font-semibold hover:bg-primary/90 active:bg-primary/95 transition-colors shadow-soft"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{showForm ? fa.request.cancel : fa.users.newUser}</span>
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-card rounded-xl border border-border shadow-soft p-4 md:p-5 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Field label={fa.users.name}>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-sm placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                required
              />
            </Field>
            <Field label={fa.users.email}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-sm placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                required
                dir="ltr"
                placeholder="user@example.com"
              />
            </Field>
            <Field label={fa.users.password}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-sm placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                required
                minLength={6}
                dir="ltr"
                placeholder="••••••••"
              />
            </Field>
          </div>
          {error && (
            <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {createMutation.isPending ? fa.common.loading : fa.request.save}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-card text-foreground border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
            >
              {fa.request.cancel}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="ms-2 text-sm">{fa.common.loading}</span>
        </div>
      ) : users?.length === 0 ? (
        <div className="bg-card rounded-xl border border-border">
          <EmptyState icon={UsersIcon} title={fa.users.empty} />
        </div>
      ) : (
        <>
          {/* Mobile: cards */}
          <ul className="md:hidden space-y-2">
            {users?.map((u: any) => (
              <li
                key={u.id}
                className="bg-card rounded-xl border border-border p-3.5 flex items-center gap-3"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  u.role === 'manager' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                }`}>
                  {u.role === 'manager' ? <ShieldCheck className="w-5 h-5" /> : <User className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-sm text-foreground truncate">{u.name}</p>
                    {!u.active && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                        {fa.users.inactive}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate" dir="ltr">{u.email}</p>
                </div>
                <span
                  className={`text-[10px] font-semibold px-2 py-1 rounded-full whitespace-nowrap ${
                    u.role === 'manager'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {u.role === 'manager' ? fa.users.manager : fa.users.employee}
                </span>
              </li>
            ))}
          </ul>

          {/* Desktop: table */}
          <div className="hidden md:block bg-card rounded-xl border border-border overflow-hidden shadow-soft">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-start px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                    {fa.users.name}
                  </th>
                  <th className="text-start px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                    {fa.users.email}
                  </th>
                  <th className="text-start px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                    {fa.users.role}
                  </th>
                  <th className="text-start px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                    {fa.users.active}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users?.map((u: any) => (
                  <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-bold shrink-0">
                          {u.name?.charAt(0) || '؟'}
                        </div>
                        <span className="font-medium text-foreground">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground" dir="ltr">{u.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          u.role === 'manager'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {u.role === 'manager' ? <ShieldCheck className="w-3 h-3" /> : <User className="w-3 h-3" />}
                        {u.role === 'manager' ? fa.users.manager : fa.users.employee}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.active ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                          <span className="w-1.5 h-1.5 rounded-full bg-success" />
                          {fa.users.active}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                          {fa.users.inactive}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-foreground mb-1.5">{label}</label>
      {children}
    </div>
  );
}
