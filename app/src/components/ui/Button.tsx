'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'aura';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variants: Record<string, string> = {
      primary: 'bg-aura-primary text-white hover:bg-aura-primary-vibrant shadow-lg shadow-aura-glow hover:shadow-aura-glow-lg focus:ring-aura-primary',
      secondary: 'bg-white/10 text-white hover:bg-white/20 border border-white/10 focus:ring-white/20',
      outline: 'bg-transparent text-white border border-white/20 hover:bg-white/10 hover:border-white/30 focus:ring-white/20',
      ghost: 'bg-transparent text-white/80 hover:bg-white/10 hover:text-white focus:ring-white/10',
      danger: 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 hover:text-red-300 focus:ring-red-500/30',
      aura: 'bg-gradient-to-r from-aura-primary to-aura-accent text-white hover:from-aura-primary-vibrant hover:to-aura-accent shadow-lg shadow-aura-gradient focus:ring-aura-primary',
    };
    
    const sizes: Record<string, string> = {
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-5 py-2.5 text-base gap-2',
      lg: 'px-6 py-3 text-lg gap-2.5',
      xl: 'px-8 py-4 text-xl gap-3',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
