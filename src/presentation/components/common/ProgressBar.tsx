import React from 'react';
import { clsx } from 'clsx';

interface ProgressBarProps {
  value: number; // 0-N, supports > 100 for overflow
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
  const isOverflow = value > 100;
  const displayValue = Math.max(0, value);
  const barWidth = Math.min(100, displayValue);

  const autoColor = (): typeof color => {
    if (isOverflow) return 'amber';
    if (color !== 'default') return color;
    if (displayValue >= 70) return 'green';
    if (displayValue >= 40) return 'indigo';
    return 'amber';
  };

  return (
    <div className={clsx('flex items-center gap-2', className)}>
      <div
        className={clsx(
          'flex-1 rounded-full overflow-hidden relative',
          sizeClasses[size],
          isOverflow
            ? 'bg-amber-100 dark:bg-amber-900/30'
            : 'bg-gray-200 dark:bg-slate-700'
        )}
      >
        {isOverflow ? (
          /* Overflow: full bar with diagonal stripe pattern */
          <div
            className="h-full w-full rounded-full"
            style={{
              background:
                'repeating-linear-gradient(45deg, #f59e0b, #f59e0b 4px, #fbbf24 4px, #fbbf24 8px)',
            }}
          />
        ) : (
          <div
            className={clsx(
              'h-full rounded-full transition-all duration-500',
              colorClasses[autoColor()],
              animated && 'animate-pulse'
            )}
            style={{ width: `${barWidth}%` }}
          />
        )}
      </div>
      {showLabel && (
        <span
          className={clsx(
            'text-xs w-8 text-right font-medium',
            isOverflow
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-gray-500 dark:text-gray-400'
          )}
        >
          {displayValue}%
        </span>
      )}
    </div>
  );
};
