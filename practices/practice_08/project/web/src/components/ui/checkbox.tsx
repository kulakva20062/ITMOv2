import * as React from 'react';

import { cn } from '@/lib/utils';

const Checkbox = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type: _type, ...props }, ref) => (
    <input
      ref={ref}
      type="checkbox"
      className={cn(
        'ui-checkbox peer relative h-4 w-4 shrink-0 appearance-none rounded-none border border-input bg-background checked:border-primary checked:bg-primary disabled:cursor-not-allowed disabled:opacity-50 [&[aria-invalid="true"]]:border-destructive',
        className,
      )}
      {...props}
    />
  ),
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };
