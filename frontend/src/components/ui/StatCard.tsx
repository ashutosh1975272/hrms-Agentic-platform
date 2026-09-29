import type { CSSProperties, ReactNode } from 'react';

import { Icon, type IconName } from './Icon';

export interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: IconName;
  /** Index within a stagger group; drives the load-in delay. */
  staggerIndex?: number;
  className?: string;
}

export function StatCard({ label, value, hint, icon, staggerIndex = 0, className = '' }: StatCardProps) {
  return (
    <div
      style={{ '--stagger-delay': `${Math.min(staggerIndex, 8) * 60}ms` } as CSSProperties}
      className={`stagger-item glass-panel rounded-card p-4 ${className}`.trim()}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {icon ? (
          <span className="inline-flex size-8 items-center justify-center rounded-full bg-primary-soft text-primary-strong">
            <Icon name={icon} size={16} />
          </span>
        ) : null}
      </div>
      <p className="mt-1.5 font-heading text-2xl font-semibold text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
