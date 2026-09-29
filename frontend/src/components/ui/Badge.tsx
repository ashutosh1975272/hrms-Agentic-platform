import type { ReactNode } from 'react';

import { initialsOf } from './initials';

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

const TONE_CLASS: Record<BadgeTone, string> = {
  neutral: 'bg-muted text-foreground',
  primary: 'bg-primary-soft text-primary-strong',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-destructive/10 text-destructive-strong',
  info: 'bg-info-soft text-info',
};

export interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}

export function Badge({ tone = 'neutral', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${TONE_CLASS[tone]} ${className}`.trim()}
    >
      {children}
    </span>
  );
}

export interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const AVATAR_SIZE = {
  sm: 'size-9 text-xs',
  md: 'size-11 text-sm',
  lg: 'size-14 text-base',
} as const;

export function Avatar({ name, size = 'md', className = '' }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-primary-soft font-semibold text-primary-strong ${AVATAR_SIZE[size]} ${className}`.trim()}
    >
      {initialsOf(name)}
    </span>
  );
}
