import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressProps {
  value: number; // 0 to 100
  className?: string;
  barClassName?: string;
}

export function Progress({ value, className, barClassName }: ProgressProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={cn('w-full h-2 bg-slate-800 rounded-full overflow-hidden', className)}>
      <div
        className={cn('h-full bg-violet-600 transition-all duration-300 ease-out rounded-full', barClassName)}
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
}
