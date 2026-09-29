import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { Icon, type IconName } from './Icon';

/**
 * Shared button (MASTER.md component specs + ui-ux.md rules):
 * 44px minimum touch target, visible focus ring, 200ms transitions, explicit
 * `type`, optional icon. All colour comes from MASTER.md theme tokens.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'icon';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-on-accent border border-transparent hover:brightness-95 active:brightness-90',
  secondary: 'bg-transparent text-primary border-2 border-primary hover:bg-primary/10',
  ghost: 'bg-transparent text-foreground border border-transparent hover:bg-muted',
  danger: 'bg-destructive text-on-destructive border border-transparent hover:brightness-95',
};

const SIZES: Record<ButtonSize, string> = {
  md: 'min-h-11 px-4 py-2 text-sm gap-2',
  icon: 'h-11 w-11 p-0',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  iconAfter?: IconName;
  loading?: boolean;
  children?: ReactNode;
}

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  iconAfter,
  loading = false,
  disabled,
  className = '',
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`inline-flex cursor-pointer items-center justify-center rounded-lg font-semibold transition-[background-color,color,border-color,filter,transform] duration-200 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      disabled={disabled || loading}
      type={type}
      {...rest}
    >
      {icon ? (
        <Icon
          className={`h-4 w-4 shrink-0 ${loading ? 'motion-safe:animate-spin' : ''}`}
          name={loading ? 'loader' : icon}
        />
      ) : null}
      {children}
      {iconAfter ? <Icon className="h-4 w-4" name={iconAfter} /> : null}
    </button>
  );
}
