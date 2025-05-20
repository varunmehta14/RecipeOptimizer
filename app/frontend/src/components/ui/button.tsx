import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'destructive';
  size?: 'default' | 'sm' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:pointer-events-none',
          
          // Variants
          variant === 'default' && 'bg-primary-600 text-white hover:bg-primary-700',
          variant === 'outline' && 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
          variant === 'destructive' && 'bg-red-500 text-white hover:bg-red-600',
          
          // Sizes
          size === 'default' && 'h-10 py-2 px-4',
          size === 'sm' && 'h-8 px-3 text-sm',
          size === 'lg' && 'h-12 px-6 text-lg',
          
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button'; 