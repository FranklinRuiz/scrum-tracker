import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';

interface AlertBadgeProps {
  count: number;
  className?: string;
}

export const AlertBadge: React.FC<AlertBadgeProps> = ({ count, className }) => {
  if (count === 0) return null;
  return (
    <div className={clsx('relative inline-flex items-center', className)}>
      <AlertTriangle className="h-5 w-5 text-amber-500" />
      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
        {count > 9 ? '9+' : count}
      </span>
    </div>
  );
};
