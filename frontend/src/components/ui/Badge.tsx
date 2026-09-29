import type { ReactNode } from 'react';

import { Icon, type IconName } from './Icon';

export type BadgeTone = 'neutral' | 'info' | 'high' | 'medium' | 'success';

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-muted text-muted-foreground border border-border',
  info: 'bg-primary/10 text-primary border border-primary/30',
  success: 'bg-primary/10 text-primary border border-primary/30',
  medium: 'bg-accent text-on-accent border border-transparent',
  high: 'bg-destructive text-on-destructive border border-transparent',
};

const TONE_ICON: Record<BadgeTone, IconName | null> = {
  neutral: null,
  info: 'shield-check',
  success: 'check',
  medium: 'alert',
  high: 'alert',
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
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${TONES[tone]} ${className}`}
    >
      {iconName ? <Icon className="h-3.5 w-3.5" name={iconName} /> : null}
      {children}
    </span>
  );
}
