import * as React from 'react';
import { cn } from '@/lib/utils';

export type ButtonVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'glass'
  | 'ghost'
  | 'destructive'
  | 'danger'
  | 'link';
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const normalizeVariant = (v: ButtonVariant = 'default') => {
  if (v === 'primary') return 'default';
  if (v === 'glass') return 'outline';
  if (v === 'danger') return 'destructive';
  return v;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', type = 'button', ...props }, ref) => {
    const normalized = normalizeVariant(variant);
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          'shadcn-btn',
          `shadcn-btn--${normalized}`,
          `shadcn-btn--size-${size}`,
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
