import { AlertTriangle, Inbox, LoaderCircle } from 'lucide-react';
import type { ReactNode } from 'react';

interface PanelStateProps {
  title: string;
  description: string;
  type?: 'empty' | 'error';
  action?: ReactNode;
}

export function PanelState({ title, description, type = 'empty', action }: PanelStateProps) {
  return (
    <div className="flex h-full min-h-[180px] items-center justify-center px-6 py-10">
      <div className="text-center max-w-xs">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--panel-2)] border border-[var(--border-subtle)]">
          {type === 'error' ? (
            <AlertTriangle className="h-5 w-5 text-red-400" />
          ) : (
            <Inbox className="h-5 w-5 text-[var(--text-muted)]" />
          )}
        </div>
        <h3 className="text-sm font-bold text-[var(--text-primary)]">{title}</h3>
        <p className="mt-2 text-xs text-[var(--text-muted)]">{description}</p>
        {action ? <div className="mt-4">{action}</div> : null}
      </div>
    </div>
  );
}

interface RowsSkeletonProps {
  rows?: number;
}

export function RowsSkeleton({ rows = 6 }: RowsSkeletonProps) {
  return (
    <div className="px-4 py-3" role="status" aria-live="polite" aria-label="Loading data">
      <div className="mb-3 flex items-center gap-2 text-xs text-[var(--text-muted)]">
        <LoaderCircle className="h-4 w-4 animate-spin" />
        <span>Loading</span>
      </div>
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="skeleton-line h-7 w-full rounded-md" />
        ))}
      </div>
    </div>
  );
}
