import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';
import type { UserStory } from '../../../domain/entities/UserStory';
import type { Developer } from '../../../domain/entities/Developer';
import { PRIORITY_COLORS, PRIORITY_LABELS } from '../../../domain/value-objects/Priority';
import { isTerminalStatus } from '../../../domain/value-objects/StoryStatus';
import { Badge } from '../common/Badge';
import { ProgressBar } from '../common/ProgressBar';
import { AvatarGroup } from '../common/Avatar';

interface KanbanCardProps {
  story: UserStory;
  developers: Developer[];
  onClick: () => void;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({ story, developers, onClick }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: story.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const assignedDevs = developers.filter((d) => story.assignees.includes(d.id));
  const isOverdue =
    !isTerminalStatus(story.status) &&
    story.commitmentDate &&
    new Date(story.commitmentDate) < new Date();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={clsx(
        'bg-white dark:bg-slate-800 rounded-lg border shadow-sm p-3',
        'cursor-grab active:cursor-grabbing select-none',
        'transition-all duration-150',
        isDragging && 'opacity-50 shadow-xl ring-2 ring-indigo-500',
        story.isBlocked
          ? 'border-red-400 dark:border-red-600'
          : isOverdue
          ? 'border-amber-400 dark:border-amber-500'
          : 'border-gray-200 dark:border-slate-700',
        'hover:shadow-md'
      )}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {/* Priority + points */}
      <div className="flex items-center justify-between mb-2">
        <Badge className={PRIORITY_COLORS[story.priority]}>
          {PRIORITY_LABELS[story.priority]}
        </Badge>
        <div className="flex items-center gap-1">
          {story.isBlocked && (
            <AlertTriangle className="h-3.5 w-3.5 text-red-500 animate-pulse" />
          )}
          <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{story.points}pt</span>
        </div>
      </div>

      {/* Title */}
      <p className="text-sm font-medium text-gray-900 dark:text-white mb-2 line-clamp-2">
        {story.title}
      </p>

      {/* Progress */}
      <ProgressBar value={story.progress} size="sm" className="mb-2" />

      {/* Footer */}
      <div className="flex items-center justify-between">
        <AvatarGroup developers={assignedDevs} max={3} size="xs" />
        <span className="text-xs text-gray-400 dark:text-gray-500">{story.progress}%</span>
      </div>
    </div>
  );
};
