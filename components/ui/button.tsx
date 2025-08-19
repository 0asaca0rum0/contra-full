import { cn } from '../../lib/cn';
import React from 'react';

type Variants = 'default' | 'outline' | 'ghost' | 'secondary' | 'destructive';
type Sizes = 'sm' | 'default' | 'lg' | 'icon';

const base = 'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/40 disabled:pointer-events-none disabled:opacity-50 shadow-sm';
const variantStyles: Record<Variants, string> = {
  default: 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90',
  secondary: 'bg-[var(--color-secondary)] text-[var(--color-text)] hover:bg-[var(--color-secondary)]/90',
  destructive: 'bg-[var(--color-error)] text-white hover:bg-[var(--color-error)]/90',
  outline: 'border border-white/40 text-[#1F1F1F] bg-white/80 backdrop-blur-md hover:bg-white/90',
  ghost: 'text-[#1F1F1F] hover:bg-black/5',
};
const sizeStyles: Record<Sizes, string> = {
  sm: 'h-8 rounded-md px-3',
  default: 'h-9 px-4 py-2',
  lg: 'h-10 rounded-md px-8',
  icon: 'h-9 w-9',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variants;
  size?: Sizes;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => (
    <button ref={ref} className={cn(base, variantStyles[variant], sizeStyles[size], className)} {...props} />
  )
);
Button.displayName = 'Button';

export default Button;
