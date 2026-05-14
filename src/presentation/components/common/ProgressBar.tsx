import React from 'react';
import { clsx } from 'clsx';

interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: 'default' | 'green' | 'amber' | 'red' | 'indigo';
  showLabel?: boolean;
  animated?: boolean;
}

const sizeClasses = {
  sm: 'h-1.5',
  md: 'h-2',
  lg: 'h-3',
};

const colorClasses = {
  default: 'bg-indigo-500',
  green: 'bg-green-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  indigo: 'bg-indigo-500',
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  className,
  size = 'md',
  color = 'default',
  showLabel = false,
  animated = false,
}) => {
  const clamped = Math.min(100, Math.max(0, value));

  const autoColor = (): typeof color => {
    if (color !== 'default') return color;
    if (clamped >= 70) return 'green';
    if (clamped >= 40) return 'indigo';
    return 'amber';
  };

  return (
    <div className={clsx('flex items-center gap-2', className)}>
      <div
        className={clsx(
          'flex-1 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden',
          sizeClasses[size]
        )}
      >
        <div
          className={clsx(
            'h-full rounded-full transition-all duration-500',
            colorClasses[autoColor()],
            animated && 'animate-pulse'
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-gray-500 dark:text-gray-400 w-8 text-right">
          {clamped}%
        </span>
      )}
    </div>
  );
};
