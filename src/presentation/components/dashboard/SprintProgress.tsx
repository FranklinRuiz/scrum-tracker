import React from 'react';
import { format, parseISO } from 'date-fns';
import { CheckCircle2, Clock, Target, AlertTriangle } from 'lucide-react';
import type { Sprint } from '../../../domain/entities/Sprint';
import type { UserStory } from '../../../domain/entities/UserStory';
import type { ProgressRecord } from '../../../domain/entities/ProgressRecord';
import { isTerminalStatus } from '../../../domain/value-objects/StoryStatus';
import { Card } from '../common/Card';
import { ProgressBar } from '../common/ProgressBar';
import { Badge } from '../common/Badge';
import { STORY_STATUS_COLORS, STORY_STATUS_LABELS } from '../../../domain/value-objects/StoryStatus';

const HOURS_PER_POINT = 8;

interface SprintProgressProps {
  sprint: Sprint;
  stories: UserStory[];
  progressRecords: ProgressRecord[];
}

export const SprintProgress: React.FC<SprintProgressProps> = ({ sprint, stories, progressRecords }) => {
  // Progress bar: hours worked vs total capacity
  const storyIds = new Set(stories.map((s) => s.id));
  const totalHours = progressRecords
    .filter((p) => storyIds.has(p.storyId))
    .reduce((sum, p) => sum + p.hoursWorked, 0);
  const totalCapacity = stories.reduce((sum, s) => sum + s.points * HOURS_PER_POINT, 0);
  const progress = totalCapacity > 0 ? Math.round((totalHours / totalCapacity) * 100) : 0;

  // Completed points stat (stories fully done or commitmentMet)
  const storyIdsWithCommitmentMet = new Set(
    progressRecords.filter((p) => p.commitmentMet).map((p) => p.storyId)
  );
  const completedPoints = stories
    .filter((s) => isTerminalStatus(s.status) || storyIdsWithCommitmentMet.has(s.id))
    .reduce((sum, s) => sum + s.points, 0);

  const statusCounts = stories.reduce<Record<string, number>>((acc, s) => {
    acc[s.status] = (acc[s.status] ?? 0) + 1;
    return acc;
  }, {});

  const blockedCount = stories.filter((s) => s.isBlocked).length;

  return (
    <Card>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">{sprint.name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{sprint.goal}</p>
        </div>
        <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
          Activo
        </Badge>
      </div>

      {/* Dates */}
      <div className="flex items-center gap-4 mb-4 text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1.5">
          <Clock className="h-4 w-4" />
          {format(parseISO(sprint.startDate), 'MMM d')} – {format(parseISO(sprint.endDate), 'MMM d, yyyy')}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progreso del sprint</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {(totalHours / HOURS_PER_POINT).toFixed(1)} / {sprint.committedPoints} pts
            </span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">{progress}%</span>
          </div>
        </div>
        <ProgressBar value={progress} size="lg" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Target className="h-3.5 w-3.5 text-indigo-500" />
            <span className="text-lg font-bold text-gray-900 dark:text-white">{sprint.committedPoints}</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Comprometidos</p>
        </div>
        <div className="text-center p-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            <span className="text-lg font-bold text-gray-900 dark:text-white">{completedPoints}</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Completados</p>
        </div>
        <div className="text-center p-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            {blockedCount > 0 && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
            <span className="text-lg font-bold text-gray-900 dark:text-white">{blockedCount}</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Bloqueadas</p>
        </div>
      </div>

      {/* Status breakdown */}
      {Object.keys(statusCounts).length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Estado de las historias</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status} className="flex items-center gap-1">
                <Badge className={STORY_STATUS_COLORS[status as keyof typeof STORY_STATUS_COLORS]}>
                  {STORY_STATUS_LABELS[status as keyof typeof STORY_STATUS_LABELS]} ({count})
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};
