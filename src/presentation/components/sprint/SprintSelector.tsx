import React from 'react';
import { clsx } from 'clsx';
import type { Sprint } from '@/domain/entities/Sprint';
import { Select } from '../common/Select';

interface SprintSelectorProps {
  sprints: Sprint[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  className?: string;
}

const statusDot = {
  planned: 'bg-gray-400',
  active: 'bg-green-500',
  completed: 'bg-blue-500',
};

export const SprintSelector: React.FC<SprintSelectorProps> = ({
  sprints,
  selectedId,
  onSelect,
  className,
}) => {
  const selected = sprints.find((s) => s.id === selectedId);

  return (
    <div className={clsx('w-full', className)}>
      <Select value={selectedId ?? ''} onChange={(e) => onSelect(e.target.value)}>
        <option value="" disabled>Seleccionar sprint</option>
        {sprints.map((sprint) => (
          <option key={sprint.id} value={sprint.id}>
            {sprint.name} ({sprint.status})
          </option>
        ))}
      </Select>
      {selected && (
        <div className="flex items-center gap-2 mt-1.5 px-1">
          <span className={clsx('h-2 w-2 rounded-full', statusDot[selected.status])} />
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {selected.startDate} – {selected.endDate}
          </span>
        </div>
      )}
    </div>
  );
};
