import React from 'react';
import { cn } from '@/lib/utils';

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <label
        className={cn(
          'text-sm font-medium leading-none peer-disabled:cursor-not-allowed',
          'peer-disabled:opacity-70 dark:text-slate-300',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Label.displayName = 'Label';

export { Label }; 