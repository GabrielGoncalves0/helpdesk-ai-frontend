import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const variants = {
      primary: 'bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-900/20 border border-violet-500/30',
      secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700/50',
      outline: 'bg-transparent hover:bg-slate-800/60 text-slate-200 border border-slate-700',
      ghost: 'bg-transparent hover:bg-slate-800/40 text-slate-300',
      destructive: 'bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-900/20',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs rounded-lg',
      md: 'px-4 py-2 text-sm rounded-xl',
      lg: 'px-6 py-3 text-base rounded-xl font-medium',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50 disabled:pointer-events-none cursor-pointer font-medium',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
