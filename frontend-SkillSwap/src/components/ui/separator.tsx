import * as React from 'react';
import { cn } from '@/lib/utils';

interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
}

export function Separator({
  className,
  orientation = 'horizontal',
  ...props
}: SeparatorProps) {
  return (
    <div
      role="separator"
      className={cn(
        'shadcn-separator',
        orientation === 'vertical' ? 'shadcn-separator--vertical' : 'shadcn-separator--horizontal',
        className
      )}
      {...props}
    />
  );
}

