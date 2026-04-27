import { Pencil, Clock3, CheckCircle2, XCircle, RefreshCcw } from 'lucide-react';
import { fa } from '../../i18n/fa';

const config: Record<string, { className: string; Icon: typeof Pencil; label: string }> = {
  draft: {
    className: 'bg-muted text-muted-foreground border-border',
    Icon: Pencil,
    label: fa.status.draft,
  },
  pending: {
    className: 'bg-warning/10 text-warning border-warning/30',
    Icon: Clock3,
    label: fa.status.pending,
  },
  approved: {
    className: 'bg-success/10 text-success border-success/30',
    Icon: CheckCircle2,
    label: fa.status.approved,
  },
  rejected: {
    className: 'bg-destructive/10 text-destructive border-destructive/30',
    Icon: XCircle,
    label: fa.status.rejected,
  },
  needs_revision: {
    className: 'bg-orange-100 text-orange-700 border-orange-200',
    Icon: RefreshCcw,
    label: fa.status.needs_revision,
  },
};

export function StatusBadge({ status, size = 'md' }: { status: string; size?: 'sm' | 'md' }) {
  const c = config[status] || config.draft;
  const padding = size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-1';
  const text = size === 'sm' ? 'text-[10px]' : 'text-xs';
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium whitespace-nowrap ${padding} ${text} ${c.className}`}
    >
      <c.Icon className={iconSize} strokeWidth={2} />
      {c.label}
    </span>
  );
}
