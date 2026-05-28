import React from 'react';
import { cn } from '@/shared/lib/utils';
import { motion, type HTMLMotionProps } from 'motion/react';

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "inline-flex items-center justify-center text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-accent text-accent-foreground hover:bg-accent/90": variant === 'primary',
            "bg-border text-foreground hover:bg-border/80": variant === 'secondary',
            "hover:bg-muted text-foreground": variant === 'ghost',
            "glass-light hover:bg-white/10 text-foreground": variant === 'glass',
            "h-8 px-3 text-xs": size === 'sm',
            "h-9 px-4": size === 'md',
            "h-10 px-8": size === 'lg',
            "h-8 w-8": size === 'icon',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
