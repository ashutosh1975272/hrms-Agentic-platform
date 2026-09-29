import type { ReactNode } from 'react';

export interface PanelProps {
  title: string;
  headingLevel?: 2 | 3;
  children: ReactNode;
  className?: string;
}

export function Panel({ title, headingLevel = 2, children, className = '' }: PanelProps) {
  const Heading = headingLevel === 3 ? 'h3' : 'h2';
  return (
    <section
      aria-label={title}
      className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}
    >
      <Heading className="text-base font-semibold text-slate-900">{title}</Heading>
      <div className="mt-4">{children}</div>
    </section>
  );
}
