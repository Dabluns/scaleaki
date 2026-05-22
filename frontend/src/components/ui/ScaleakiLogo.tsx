import React from 'react';
import Image from 'next/image';

interface ScaleakiLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export const ScaleakiLogo: React.FC<ScaleakiLogoProps> = ({ size = 40, className = '', showText = false }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div 
        className="relative flex items-center justify-center shrink-0"
        style={{ width: size, height: size }}
      >
        <Image
          src="/branding/s-transparente.png"
          alt="Scaleaki Logo Original com Cifrão"
          width={size * 2} // Importante para manter nítido em telas retina (high-DPI)
          height={size * 2}
          className="w-full h-full object-contain"
          quality={100}
          priority
        />
      </div>
      
      {showText && (
        <span className="font-bold tracking-tight text-white" style={{ fontSize: size * 0.45 }}>
          Scale<span className="text-green-500">aki</span>
        </span>
      )}
    </div>
  );
};
