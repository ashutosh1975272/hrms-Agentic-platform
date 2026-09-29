import type { ReactNode } from 'react';

import { initialsOf } from './initials';
import { Icon, type IconName } from './Icon';

export type BadgeTone =
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'high'
  | 'medium';

const TONE_CLASS: Record<BadgeTone, string> = {
  neutral: 'bg-muted text-foreground',
  primary: 'bg-primary-soft text-primary-strong',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-destructive/10 text-destructive-strong',
  info: 'bg-info-soft text-info',
  high: 'bg-destructive text-on-destructive border border-transparent',
  medium: 'bg-accent text-on-accent border border-transparent',
};

const TONE_ICON: Record<BadgeTone, IconName | null> = {
  neutral: null,
  primary: null,
  success: null,
  warning: null,
  danger: null,
  info: null,
  high: 'alert',
  medium: 'alert',
};

export interface BadgeProps {
  tone?: BadgeTone;
  icon?: IconName | null;
  children: ReactNode;
  className?: string;
}

export function Badge({ tone = 'neutral', icon, children, className = '' }: BadgeProps) {
  const iconName = icon === undefined ? TONE_ICON[tone] : icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${TONE_CLASS[tone]} ${className}`.trim()}
    >
      {iconName ? <Icon className="h-3.5 w-3.5" name={iconName} /> : null}
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
