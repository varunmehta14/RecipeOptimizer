import React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm',
          'ring-offset-white placeholder:text-slate-400 focus-visible:outline-none',
          'focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700',
          'dark:bg-slate-800 dark:ring-offset-slate-800 dark:placeholder:text-slate-500',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea }; 