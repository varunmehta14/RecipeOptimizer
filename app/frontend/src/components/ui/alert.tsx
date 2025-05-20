import React from 'react';
import { cn } from '@/lib/utils';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive';
}

export function Alert({
  className,
  variant = 'default',
  ...props
}: AlertProps) {
  return (
    <div
      className={cn(
        'relative w-full rounded-lg border p-4',
        variant === 'default' && 'bg-slate-50 text-slate-900 border-slate-200 dark:bg-slate-800 dark:text-slate-50 dark:border-slate-700',
        variant === 'destructive' && 'text-white border-red-500 bg-red-500 dark:border-red-600 dark:bg-red-600',
        className
      )}
      {...props}
    />
  );
}

interface AlertTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export function AlertTitle({ className, ...props }: AlertTitleProps) {
  return (
    <h5
      className={cn('font-medium leading-none tracking-tight mb-1', className)}
      {...props}
    />
  );
}

interface AlertDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export function AlertDescription({ className, ...props }: AlertDescriptionProps) {
  return (
    <div
      className={cn('text-sm [&_p]:leading-relaxed', className)}
      {...props}
    />
  );
} 