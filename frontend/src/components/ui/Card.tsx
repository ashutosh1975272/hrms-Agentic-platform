import type { ReactNode } from 'react';

export interface CardProps {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'article' | 'section';
}

export function Card({ children, className = '', as: Tag = 'div' }: CardProps) {
  return (
    <Tag className={`glass-panel rounded-card p-5 ${className}`.trim()}>{children}</Tag>
  );
}

export interface SectionCardProps {
  title: string;
  /** Renders the title as a visible heading, defaulting to a level 2 heading. */
  headingLevel?: 2 | 3;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  id?: string;
}

export function SectionCard({
  title,
  headingLevel = 2,
  description,
  actions,
  children,
  className = '',
  bodyClassName = '',
  id,
}: SectionCardProps) {
  const Heading = headingLevel === 3 ? 'h3' : 'h2';
  const headingId = id ? `${id}-title` : undefined;
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      aria-label={headingId ? undefined : title}
      className={`glass-panel rounded-card p-5 ${className}`.trim()}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Heading className="font-heading text-base font-semibold text-foreground" id={headingId}>
            {title}
          </Heading>
          {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      <div className={`mt-4 ${bodyClassName}`.trim()}>{children}</div>
    </section>
  );
}

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
