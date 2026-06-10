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
        <defs>
          <linearGradient id="templ-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#BDE0FE" />
            <stop offset="50%" stopColor="#FFC8DD" />
            <stop offset="100%" stopColor="#B5EAD7" />
          </linearGradient>
        </defs>
        {/* Thin dark outer border */}
        <rect 
          x="4.5" 
          y="4.5" 
          width="91" 
          height="91" 
          rx="17" 
          fill="none" 
          stroke="#000000" 
          strokeWidth="1.5" 
          opacity="0.8"
        />
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
          fill="url(#templ-gradient)" 
          fontSize="36" 
          fontWeight="900" 
          fontFamily="var(--font-sans), sans-serif"
        >
          Tn
        </text>
      </svg>
    </div>
  );
};
