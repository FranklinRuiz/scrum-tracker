import React from 'react';
import { ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  sm?: boolean;
  wrapperClassName?: string;
}

export const Select: React.FC<SelectProps> = ({ sm, wrapperClassName, className, children, ...props }) => (
  <div className={clsx('relative', wrapperClassName)}>
    <select
      className={clsx(
        'w-full appearance-none pl-3 pr-9',
        'border border-gray-300 dark:border-slate-600',
        'bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm',
        'focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        sm ? 'py-1.5 rounded-md' : 'py-2 rounded-lg',
        className
      )}
      {...props}
    >
      {children}
    </select>
    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
  </div>
);
