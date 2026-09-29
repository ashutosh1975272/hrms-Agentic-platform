import type { ReactNode } from 'react';

import { EmptyState, ErrorState, SkeletonRows } from './States';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
  align?: 'left' | 'right' | 'center';
}

export interface DataTableProps<T> {
  /** Used as the accessible name of the table and shown to screen readers. */
  caption: string;
  columns: Array<Column<T>>;
  rows: readonly T[];
  /** Stable React key for a row; falls back to the row position. */
  rowKey?: (row: T, index: number) => string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  skeletonRows?: number;
}

const ALIGN_CLASS = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
} as const;

/**
 * Data table with built-in loading, empty and error states. Header cells always
 * carry scope="col" and the caption names the table for assistive technology.
 */
export function DataTable<T>({
  caption,
  columns,
  rows,
  rowKey,
  loading = false,
  error = null,
  onRetry,
  emptyTitle = 'Nothing to show yet',
  emptyDescription,
  emptyAction,
  skeletonRows = 5,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div role="status" aria-live="polite">
        <span className="sr-only">Loading {caption.toLowerCase()}…</span>
        <SkeletonRows rows={skeletonRows} columns={Math.max(columns.length, 1)} />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} {...(onRetry ? { onRetry } : {})} />;
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        {...(emptyDescription ? { description: emptyDescription } : {})}
        {...(emptyAction ? { action: emptyAction } : {})}
      />
    );
  }

  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-border">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`px-3 py-2.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase ${ALIGN_CLASS[column.align ?? 'left']} ${column.headerClassName ?? ''} ${column.className ?? ''}`.trim()}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={rowKey ? rowKey(row, rowIndex) : rowIndex}
              className="border-b border-border/70 transition-colors duration-200 last:border-0 hover:bg-muted/60"
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`px-3 py-2.5 align-middle text-foreground ${ALIGN_CLASS[column.align ?? 'left']} ${column.className ?? ''}`.trim()}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
