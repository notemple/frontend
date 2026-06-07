import React from 'react';
import { cn } from '@/shared/lib/utils';

interface TnLogoProps {
  className?: string;
  strokeWidth?: number;
  glow?: boolean;
  animated?: boolean;
}

export const TnLogo: React.FC<TnLogoProps> = ({
  className,
  strokeWidth = 3.5,
  glow = true,
  animated = true,
}) => {
  return (
    <div 
      className={cn(
        "select-none cursor-pointer",
        animated && "hover:scale-[1.08] transition-transform duration-300",
        className
      )}
    >
      <svg 
        viewBox="0 0 100 100" 
        className={cn(
          "w-full h-full pointer-events-none",
          glow && "drop-shadow-md"
        )}
      >
        {/* Outer rounded rect */}
        <rect 
          x="6" 
          y="6" 
          width="88" 
          height="88" 
          rx="16" 
          fill="#0a0a0b" 
          stroke="#1f1f23" 
          strokeWidth={strokeWidth} 
        />
        {/* Small number '26' in top right */}
        <text 
          x="80" 
          y="27" 
          textAnchor="end" 
          fill="#52525b" 
          fontSize="13" 
          fontWeight="700" 
          fontFamily="var(--font-mono), monospace"
        >
          26
        </text>
        {/* Large 'Tn' in the middle */}
        <text 
          x="50" 
          y="62" 
          textAnchor="middle" 
          fill="#bde0fe" 
          fontSize="36" 
          fontWeight="bold" 
          fontFamily="system-ui, sans-serif"
        >
          Tn
        </text>
      </svg>
    </div>
  );
};
