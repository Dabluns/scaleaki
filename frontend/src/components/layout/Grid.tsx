import React from 'react';
import clsx from 'clsx';

interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: number;
  gap?: number;
}

export const Grid: React.FC<GridProps> = ({
  children,
  cols = 2,
  gap = 4,
  className,
  ...props
}) => (
  <div
    className={clsx(
      `grid grid-cols-1 sm:grid-cols-${cols} gap-${gap}`,
      className,
    )}
    {...props}
  >
    {children}
  </div>
); 