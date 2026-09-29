import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { Icon, type IconName } from './Icon';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'subtle' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-on-accent shadow-sm hover:bg-accent-strong',
  secondary: 'border-2 border-primary bg-transparent text-primary hover:bg-primary-soft',
  ghost: 'bg-transparent text-primary hover:bg-muted',
  subtle: 'bg-muted text-foreground hover:bg-border',
  danger: 'bg-destructive text-on-destructive shadow-sm hover:bg-destructive-strong',
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: 'min-h-11 gap-1.5 px-3 text-sm',
  md: 'min-h-11 gap-2 px-4 text-sm',
  lg: 'min-h-12 gap-2 px-6 text-base',
  icon: 'h-11 w-11 shrink-0 p-0',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  iconPosition?: 'start' | 'end';
  iconAfter?: IconName;
  loading?: boolean;
  block?: boolean;
  children?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'start',
  iconAfter,
  loading = false,
  block = false,
  className = '',
  type = 'button',
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const shownIcon = loading && icon ? 'loader' : icon;
  const iconSize = size === 'lg' ? 20 : 18;
  return (
    <button
      {...rest}
      type={type}
      disabled={disabled ?? loading}
      className={[
        'inline-flex cursor-pointer items-center justify-center rounded-control font-semibold',
        'transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-out',
        'hover:-translate-y-px motion-reduce:hover:translate-y-0',
        'disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0',
        VARIANT_CLASS[variant],
        SIZE_CLASS[size],
        block ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {shownIcon && iconPosition === 'start' ? (
        <Icon name={shownIcon} size={iconSize} className={loading ? 'motion-safe:animate-spin' : ''} />
      ) : null}
      {children}
      {shownIcon && iconPosition === 'end' ? (
        <Icon name={shownIcon} size={iconSize} className={loading ? 'motion-safe:animate-spin' : ''} />
      ) : null}
      {iconAfter ? <Icon name={iconAfter} size={iconSize} /> : null}
    </button>
  );
}

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: IconName;
  /** Required: the icon is decorative, so the control needs an accessible name. */
  label: string;
  variant?: ButtonVariant;
  size?: 'sm' | 'md';
}

export function IconButton({
  icon,
  label,
  variant = 'subtle',
  size = 'md',
  className = '',
  type = 'button',
  ...rest
}: IconButtonProps) {
  const dimension = size === 'sm' ? 'size-11' : 'size-11';
  return (
    <button
      {...rest}
      type={type}
      aria-label={label}
      title={label}
      className={[
        'inline-flex cursor-pointer items-center justify-center rounded-control',
        'transition-[background-color,border-color,color,transform] duration-200 ease-out',
        'hover:-translate-y-px motion-reduce:hover:translate-y-0',
        'disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0',
        VARIANT_CLASS[variant],
        dimension,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <Icon name={icon} size={size === 'sm' ? 16 : 18} />
    </button>
  );
}
