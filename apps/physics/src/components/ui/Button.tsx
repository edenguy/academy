import { clsx } from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';

type Variant = 'primary' | 'secondary' | 'ghost' | 'good';
type Size = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-150 select-none disabled:pointer-events-none disabled:shadow-none active:scale-[0.99]';
const variants: Record<Variant, string> = {
  primary: 'bg-accent text-accent-ink ledge font-bold',
  secondary: 'bg-surface text-ink border border-line-strong hover:bg-surface-2 active:translate-y-px',
  ghost: 'text-ink-2 hover:bg-surface-2 hover:text-ink',
  good: 'bg-good-fill text-white ledge [--accent-deep:color-mix(in_srgb,var(--good-fill)_75%,black)]',
};
const sizes: Record<Size, string> = {
  sm: 'min-h-9 text-sm px-4',
  md: 'min-h-11 text-[15px] px-5',
  lg: 'min-h-13 text-base px-6',
};
const disabledClass = 'disabled:bg-surface-3 disabled:text-muted disabled:border-transparent disabled:cursor-not-allowed';

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', className?: string) {
  return clsx(base, variants[variant], sizes[size], disabledClass, className);
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return <button type="button" className={buttonClass(variant, size, className)} {...rest} />;
}

export function LinkButton({
  to,
  variant = 'primary',
  size = 'md',
  className,
  children,
}: {
  to: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link to={to} className={buttonClass(variant, size, className)}>
      {children}
    </Link>
  );
}
