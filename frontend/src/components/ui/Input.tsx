import React from 'react';
import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ error, className, icon, ...props }, ref) => (
    <div>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          className={clsx(
            'block w-full rounded border border-border bg-surface py-2 text-text-primary placeholder:text-text-tertiary shadow-sm focus:border-accent focus:ring-accent transition-colors',
            icon ? 'pl-9 pr-3' : 'px-3',
            error && 'border-error focus:border-error focus:ring-error',
            className,
          )}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
    </div>
  ),
);
Input.displayName = 'Input'; 