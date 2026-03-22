import React from 'react';
import clsx from 'clsx';

interface AvatarProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  name?: string;
  size?: number;
}

export const Avatar: React.FC<AvatarProps> = ({ src, name, size = 40, className, ...props }) => {
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : '';
  return src ? (
    <img
      src={src}
      alt={name}
      width={size}
      height={size}
      className={clsx('rounded-full object-cover', className)}
      style={{ width: size, height: size }}
      {...props}
    />
  ) : (
    <span
      className={clsx(
        'inline-flex items-center justify-center rounded-full bg-gray-200 text-gray-700 font-bold',
        className,
      )}
      style={{ width: size, height: size }}
    >
      {initials}
    </span>
  );
};

// eslint-disable-next-line @next/next/no-img-element 