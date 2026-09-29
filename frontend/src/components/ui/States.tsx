import type { ReactNode } from 'react';

import { Button } from './Button';
import { Icon, type IconName } from './Icon';

export interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={`block animate-pulse rounded bg-muted ${className}`.trim()}
    />
  );
}

export function SkeletonRows({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-2 p-4" aria-hidden="true">
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div key={rowIndex} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {Array.from({ length: columns }, (_, columnIndex) => (
            <Skeleton key={columnIndex} className="h-4" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="glass-panel rounded-card space-y-3 p-4">
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-7 w-1/3" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
}

export function LoadingState({ label }: { label: string }) {
  return (
    <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
      <span className="inline-block size-3 animate-spin rounded-full border-2 border-primary border-t-transparent motion-reduce:animate-none" />
      {label}
    </p>
  );
}

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: IconName;
  action?: ReactNode;
}

export function EmptyState({ title, description, icon = 'inbox', action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
      <span className="inline-flex size-12 items-center justify-center rounded-full bg-primary-soft text-primary-strong">
        <Icon name={icon} size={24} />
      </span>
      <p className="font-heading text-base font-semibold text-foreground">{title}</p>
      {description ? <p className="max-w-sm text-sm text-muted-foreground">{description}</p> : null}
      {action}
    </div>
  );
}

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }: ErrorStateProps) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 px-4 py-8 text-center">
      <span className="inline-flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive-strong">
        <Icon name="alert" size={24} />
      </span>
      <p className="font-heading text-base font-semibold text-foreground">{title}</p>
      <p className="max-w-sm text-sm text-foreground">{message}</p>
      {onRetry ? (
        <Button variant="secondary" icon="refresh" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
