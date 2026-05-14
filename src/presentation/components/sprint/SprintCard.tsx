import React from 'react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { Calendar, Target, CheckCircle2, Clock, Pencil, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import type { Sprint } from '../../../domain/entities/Sprint';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { ProgressBar } from '../common/ProgressBar';
import { Button } from '../common/Button';

interface SprintCardProps {
  sprint: Sprint;
  progress: number;
  completedPoints: number;
  totalStories: number;
  onEdit: (sprint: Sprint) => void;
  onDelete: (sprint: Sprint) => void;
  onSelect: (sprint: Sprint) => void;
  isSelected: boolean;
}

const statusConfig = {
  planned: { label: 'Planificado', className: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
  active: { label: 'Activo', className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  completed: { label: 'Completado', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
};

export const SprintCard: React.FC<SprintCardProps> = ({
  sprint,
  progress,
  completedPoints,
  totalStories,
  onEdit,
  onDelete,
  onSelect,
  isSelected,
}) => {
  const start = parseISO(sprint.startDate);
  const end = parseISO(sprint.endDate);
  const daysRemaining = Math.max(0, differenceInDays(end, new Date()));
  const status = statusConfig[sprint.status];

  return (
    <Card
      className={clsx(
        'cursor-pointer transition-all duration-150',
        isSelected && 'ring-2 ring-indigo-500 dark:ring-indigo-400'
      )}
      onClick={() => onSelect(sprint)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
              {sprint.name}
            </h3>
            <Badge className={status.className}>{status.label}</Badge>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{sprint.goal}</p>
        </div>
        <div className="flex items-center gap-1 ml-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); onEdit(sprint); }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); onDelete(sprint); }}
            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Dates */}
      <div className="flex items-center gap-4 mb-4 text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-4 w-4" />
          <span>{format(start, 'MMM d')} – {format(end, 'MMM d, yyyy')}</span>
        </div>
        {sprint.status === 'active' && (
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
            <Clock className="h-4 w-4" />
            <span>{daysRemaining}d restantes</span>
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Avance</span>
          <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{progress}%</span>
        </div>
        <ProgressBar value={progress} size="md" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-100 dark:border-slate-700">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <Target className="h-3.5 w-3.5 text-indigo-500" />
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {sprint.committedPoints}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Comprometidos</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {completedPoints}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Completados</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">{totalStories}</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Historias</p>
        </div>
      </div>
    </Card>
  );
};
