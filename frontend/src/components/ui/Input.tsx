import React from 'react';
import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ error, className, ...props }, ref) => (
    <div>
      <input
        ref={ref}
        className={clsx(
          'block w-full rounded border border-border bg-surface px-3 py-2 text-text-primary placeholder:text-text-tertiary shadow-sm focus:border-accent focus:ring-accent transition-colors',
          error && 'border-error focus:border-error focus:ring-error',
          className,
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
    </div>
  ),
);
Input.displayName = 'Input'; 