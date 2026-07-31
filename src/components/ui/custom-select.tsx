'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string | number;
  label: string;
}

interface CustomSelectProps {
  value: string | number;
  onChange: (value: any) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder,
  className,
}: CustomSelectProps) {
  return (
    <div className="relative w-full">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'w-full appearance-none bg-slate-950/90 border border-slate-800 hover:border-slate-700 font-medium text-slate-100 text-xs rounded-xl pl-3.5 pr-10 py-2.5 shadow-sm transition-all focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
      >
        {placeholder && (
          <option value="" disabled className="bg-slate-900 text-slate-400">
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option
            key={opt.value}
            value={opt.value}
            className="bg-slate-900 text-slate-100 py-2 font-sans"
          >
            {opt.label}
          </option>
        ))}
      </select>

      {/* Custom Chevron Arrow */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
        <ChevronDown className="w-4 h-4" />
      </div>
    </div>
  );
}
