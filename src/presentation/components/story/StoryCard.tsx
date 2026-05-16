import React from 'react';
import { AlertTriangle, Clock, User } from 'lucide-react';
import { clsx } from 'clsx';
import { format, parseISO } from 'date-fns';
import type { UserStory } from '@/domain/entities/UserStory';
import { isTerminalStatus } from '@/domain/value-objects/StoryStatus';
import type { Developer } from '@/domain/entities/Developer';
import { STORY_STATUS_COLORS, STORY_STATUS_LABELS } from '@/domain/value-objects/StoryStatus';
import { PRIORITY_COLORS, PRIORITY_LABELS } from '@/domain/value-objects/Priority';
import { Badge } from '../common/Badge';
import { ProgressBar } from '../common/ProgressBar';
import { AvatarGroup } from '../common/Avatar';

interface StoryCardProps {
  story: UserStory;
  developers: Developer[];
  onClick?: () => void;
  compact?: boolean;
}

export const StoryCard: React.FC<StoryCardProps> = ({
  story,
  developers,
  onClick,
  compact = false,
}) => {
  const assignedDevs = developers.filter((d) => story.assignees.includes(d.id));
  const isOverdue =
    !isTerminalStatus(story.status) &&
    story.commitmentDate &&
    new Date(story.commitmentDate) < new Date();

  return (
    <div
      className={clsx(
        'bg-white dark:bg-slate-800 rounded-lg border shadow-sm transition-all duration-150',
        'hover:shadow-md cursor-pointer',
        story.isBlocked
          ? 'border-red-400 dark:border-red-600 shadow-red-100 dark:shadow-red-900/20'
          : isOverdue
          ? 'border-amber-400 dark:border-amber-600'
          : 'border-gray-200 dark:border-slate-700',
        compact ? 'p-3' : 'p-4'
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge className={PRIORITY_COLORS[story.priority]}>
            {PRIORITY_LABELS[story.priority]}
          </Badge>
          <Badge className={STORY_STATUS_COLORS[story.status]}>
            {STORY_STATUS_LABELS[story.status]}
          </Badge>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {story.isBlocked && (
            <AlertTriangle className="h-4 w-4 text-red-500 animate-pulse" />
          )}
          <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
            {story.points}pt
          </span>
        </div>
      </div>

      {/* Title */}
      <h4
        className={clsx(
          'font-medium text-gray-900 dark:text-white mb-2',
          compact ? 'text-sm line-clamp-2' : 'text-sm'
        )}
      >
        {story.title}
      </h4>

      {/* Block reason */}
      {story.isBlocked && story.blockReason && !compact && (
        <div className="mb-2 px-2 py-1.5 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-700 dark:text-red-300">
          <AlertTriangle className="inline h-3 w-3 mr-1" />
          {story.blockReason}
        </div>
      )}

      {/* Progress */}
      {!compact && (
        <div className="mb-3">
          <ProgressBar value={story.progress} size="sm" showLabel />
        </div>
      )}


      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {assignedDevs.length > 0 ? (
            <AvatarGroup developers={assignedDevs} max={3} size="xs" />
          ) : (
            <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
              <User className="h-3.5 w-3.5" />
              Unassigned
            </span>
          )}
        </div>
        {story.commitmentDate && (
          <div
            className={clsx(
              'flex items-center gap-1 text-xs',
              isOverdue ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'
            )}
          >
            <Clock className="h-3 w-3" />
            {format(parseISO(story.commitmentDate), 'MMM d')}
          </div>
        )}
      </div>
    </div>
  );
};
