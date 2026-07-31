import React, { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'purple' | 'cyan';
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  const variants = {
    default: 'bg-slate-800 text-slate-300 border-slate-700/60',
    success: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30',
    warning: 'bg-amber-950/80 text-amber-300 border-amber-500/30',
    purple: 'bg-violet-950/80 text-violet-300 border-violet-500/30',
    cyan: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/30',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 text-xs font-medium border rounded-full transition-all duration-150',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
