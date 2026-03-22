import React from 'react';
import clsx from 'clsx';

interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  spacing?: number;
}

export const Stack: React.FC<StackProps> = ({
  children,
  spacing = 4,
  className,
  ...props
}) => (
  <div
    className={clsx(
      `flex flex-col space-y-${spacing}`,
      className,
    )}
    {...props}
  >
    {children}
  </div>
); 