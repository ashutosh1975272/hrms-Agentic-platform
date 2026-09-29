import { Icon } from './Icon';

export interface PaginationProps {
  page: number;
  pageCount: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  label?: string;
}

function rangeLabel(from: number, to: number, total: number): string {
  return `${from}–${to} of ${total}`;
}

export function Pagination({
  page,
  pageCount,
  totalItems,
  pageSize,
  onPageChange,
  label = 'Pagination',
}: PaginationProps) {
  if (totalItems === 0) {
    return null;
  }

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);
  const canPrevious = page > 1;
  const canNext = page < pageCount;

  return (
    <nav
      aria-label={label}
      className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-1 pt-3"
    >
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {rangeLabel(from, to, totalItems)}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={!canPrevious}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-control border border-border px-3 text-sm font-medium text-foreground transition-colors duration-200 hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border disabled:hover:text-foreground"
        >
          <Icon name="chevron-left" size={16} />
          Previous
        </button>
        <span className="text-sm text-muted-foreground">
          Page {page} of {pageCount}
        </span>
        <button
          type="button"
          disabled={!canNext}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-control border border-border px-3 text-sm font-medium text-foreground transition-colors duration-200 hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border disabled:hover:text-foreground"
        >
          Next
          <Icon name="chevron-right" size={16} />
        </button>
      </div>
    </nav>
  );
}
