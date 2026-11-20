import * as React from 'react';

import { cn } from '@/lib/utils';

const Spinner = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      aria-hidden="true"
      className={cn('ui-spinner inline-block size-4 shrink-0', className)}
      {...props}
    />
  ),
);
Spinner.displayName = 'Spinner';

export { Spinner };
