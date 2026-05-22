import React from 'react';

interface ScaleakiLogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

export const ScaleakiLogo: React.FC<ScaleakiLogoProps> = ({ size = 40, className = '', ...props }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="scaleaki-brand-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#15803d" />
        </linearGradient>
      </defs>
      
      {/* Background Rounded Square */}
      <rect
        x="0"
        y="0"
        width="100"
        height="100"
        rx="24"
        fill="url(#scaleaki-brand-grad)"
      />
      
      {/* White Circle */}
      <circle
        cx="50"
        cy="50"
        r="24"
        stroke="white"
        strokeWidth="8"
        fill="none"
      />
      
      {/* The Letter S */}
      <text
        x="50"
        y="64"
        fontFamily="Arial, system-ui, sans-serif"
        fontWeight="900"
        fontSize="40"
        fill="white"
        textAnchor="middle"
      >
        S
      </text>
    </svg>
  );
};
