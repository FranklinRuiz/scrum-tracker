import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { clsx } from 'clsx';
import type { UserStory } from '@/domain/entities/UserStory.ts';
import type { Developer } from '@/domain/entities/Developer';
import type { StoryStatus } from '@/domain/value-objects/StoryStatus';
import { STORY_STATUS_LABELS } from '@/domain/value-objects/StoryStatus';
import { KanbanCard } from './KanbanCard';

interface KanbanColumnProps {
  status: StoryStatus;
  stories: UserStory[];
  developers: Developer[];
  onCardClick: (story: UserStory) => void;
}

const columnColors: Record<StoryStatus, string> = {
  'open': 'border-gray-300 dark:border-slate-600',
  'blocked': 'border-red-400 dark:border-red-700',
  'in-development': 'border-blue-300 dark:border-blue-700',
  'done-development': 'border-cyan-300 dark:border-cyan-700',
  'in-certification': 'border-purple-300 dark:border-purple-700',
  'done-certification': 'border-violet-300 dark:border-violet-700',
  'pase-management': 'border-orange-300 dark:border-orange-700',
  'finalized': 'border-green-300 dark:border-green-700',
  'done-prd': 'border-emerald-300 dark:border-emerald-700',
};

const headerColors: Record<StoryStatus, string> = {
  'open': 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  'blocked': 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  'in-development': 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  'done-development': 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400',
  'in-certification': 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
  'done-certification': 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400',
  'pase-management': 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
  'finalized': 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  'done-prd': 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
};

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  status,
  stories,
  developers,
  onCardClick,
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const storyIds = stories.map((s) => s.id);

  return (
    <div
      className={clsx(
        'flex flex-col min-w-[240px] max-w-[280px] rounded-xl border-2',
        'bg-gray-50 dark:bg-slate-900 flex-shrink-0',
        columnColors[status],
        isOver && 'ring-2 ring-indigo-400 ring-offset-1'
      )}
    >
      {/* Header */}
      <div className={clsx('px-3 py-2.5 rounded-t-lg border-b border-inherit', headerColors[status])}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide">
            {STORY_STATUS_LABELS[status]}
          </span>
          <span className="ml-2 bg-white/60 dark:bg-black/20 text-inherit rounded-full text-xs font-bold px-1.5 py-0.5">
            {stories.length}
          </span>
        </div>
      </div>

      {/* Cards */}
      <div
        ref={setNodeRef}
        className={clsx(
          'flex-1 p-2 space-y-2 min-h-[200px] overflow-y-auto',
          isOver && 'bg-indigo-50/50 dark:bg-indigo-900/10'
        )}
      >
        <SortableContext items={storyIds} strategy={verticalListSortingStrategy}>
          {stories.map((story) => (
            <KanbanCard
              key={story.id}
              story={story}
              developers={developers}
              onClick={() => onCardClick(story)}
            />
          ))}
        </SortableContext>
        {stories.length === 0 && (
          <div className="flex items-center justify-center h-20 text-xs text-gray-400 dark:text-gray-600">
            Drop here
          </div>
        )}
      </div>
    </div>
  );
};
