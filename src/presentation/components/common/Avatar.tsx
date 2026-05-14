import React from 'react';
import { clsx } from 'clsx';
import type { Developer } from '../../../domain/entities/Developer';

interface AvatarProps {
  developer: Developer;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showName?: boolean;
  className?: string;
}

const sizeClasses = {
  xs: 'h-5 w-5 text-xs',
  sm: 'h-7 w-7 text-xs',
  md: 'h-8 w-8 text-sm',
  lg: 'h-10 w-10 text-base',
};

export const Avatar: React.FC<AvatarProps> = ({
  developer,
  size = 'md',
  showName = false,
  className,
}) => {
  const initials = developer.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={clsx('flex items-center gap-2', className)}>
      <div
        className={clsx(
          'rounded-full flex items-center justify-center font-semibold text-white shrink-0',
          sizeClasses[size]
        )}
        style={{ backgroundColor: developer.avatarColor }}
        title={developer.name}
      >
        {initials}
      </div>
      {showName && (
        <span className="text-sm text-gray-700 dark:text-gray-300">{developer.name}</span>
      )}
    </div>
  );
};

interface AvatarGroupProps {
  developers: Developer[];
  max?: number;
  size?: AvatarProps['size'];
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({ developers, max = 3, size = 'sm' }) => {
  const visible = developers.slice(0, max);
  const remaining = developers.length - max;

  return (
    <div className="flex -space-x-2">
      {visible.map((dev) => (
        <div key={dev.id} className="ring-2 ring-white dark:ring-slate-800 rounded-full">
          <Avatar developer={dev} size={size} />
        </div>
      ))}
      {remaining > 0 && (
        <div
          className={clsx(
            'rounded-full flex items-center justify-center bg-gray-200 dark:bg-slate-600',
            'text-gray-600 dark:text-gray-300 font-medium ring-2 ring-white dark:ring-slate-800',
            sizeClasses[size]
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
};
