import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { X, AlertTriangle, Calendar, User, Zap, ExternalLink, TrendingUp } from 'lucide-react';
import { clsx } from 'clsx';
import type { UserStory } from '../../../domain/entities/UserStory';
import type { Developer } from '../../../domain/entities/Developer';
import type { ProgressRecord } from '../../../domain/entities/ProgressRecord';
import { STORY_STATUS_COLORS, STORY_STATUS_LABELS, STORY_STATUS_ORDER, isTerminalStatus } from '../../../domain/value-objects/StoryStatus';
import type { StoryStatus } from '../../../domain/value-objects/StoryStatus';
import { PRIORITY_COLORS, PRIORITY_LABELS } from '../../../domain/value-objects/Priority';
import { Badge } from '../common/Badge';
import { ProgressBar } from '../common/ProgressBar';
import { Avatar } from '../common/Avatar';
import { Select } from '../common/Select';
import { ProgressTimeline } from './ProgressTimeline';
import { ProgressForm } from './ProgressForm';
import { Button } from '../common/Button';

interface StoryDetailSimpleProps {
  story: UserStory;
  developers: Developer[];
  progressRecords: ProgressRecord[];
  onClose: () => void;
  onAddProgress: (data: {
    storyId: string;
    developerId: string;
    hoursWorked: number;
    comment: string;
    newStatus: UserStory['status'];
    commitmentMet: boolean;
  }) => Promise<void>;
  onEditProgress?: (recordId: string, data: {
    storyId: string;
    developerId: string;
    hoursWorked: number;
    comment: string;
    newStatus: UserStory['status'];
    commitmentMet: boolean;
  }) => Promise<void>;
  onDeleteProgress?: (recordId: string, storyId: string) => Promise<void>;
  onEdit: () => void;
  onStatusChange?: (storyId: string, newStatus: StoryStatus) => Promise<void>;
}

export const StoryDetail: React.FC<StoryDetailSimpleProps> = ({
  story,
  developers,
  progressRecords,
  onClose,
  onAddProgress,
  onEditProgress,
  onDeleteProgress,
  onEdit,
  onStatusChange,
}) => {
  const [showProgressForm, setShowProgressForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ProgressRecord | null>(null);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const assignedDevs = developers.filter((d) => story.assignees.includes(d.id));
  const storyProgress = progressRecords
    .filter((p) => p.storyId === story.id)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  const isOverdue =
    !isTerminalStatus(story.status) &&
    story.commitmentDate &&
    new Date(story.commitmentDate) < new Date();

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative ml-auto h-full w-full max-w-2xl bg-white dark:bg-slate-800 shadow-2xl flex flex-col">
        {/* Header — fixed height, never scrolls */}
        <div className="shrink-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge className={PRIORITY_COLORS[story.priority]}>
                  {PRIORITY_LABELS[story.priority]}
                </Badge>
                <Badge className={STORY_STATUS_COLORS[story.status]}>
                  {STORY_STATUS_LABELS[story.status]}
                </Badge>
                {story.isBlocked && (
                  <Badge className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 animate-pulse">
                    <AlertTriangle className="inline h-3 w-3 mr-1" />
                    Bloqueado
                  </Badge>
                )}
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{story.title}</h2>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={onEdit}>Editar</Button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Body — takes remaining height, scrolls independently */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Bloqueo */}
            {story.isBlocked && story.blockReason && (
              <div className="flex gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
                <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-400">Bloqueado</p>
                  <p className="text-sm text-red-600 dark:text-red-300 mt-1">{story.blockReason}</p>
                </div>
              </div>
            )}

            {/* Cambio rápido de estado */}
            {onStatusChange && (
              <div className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-slate-600">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Cambiar estado</p>
                <Select
                  value={story.status}
                  disabled={isChangingStatus}
                  onChange={async (e) => {
                    const newStatus = e.target.value as StoryStatus;
                    if (newStatus === story.status) return;
                    setIsChangingStatus(true);
                    try {
                      await onStatusChange(story.id, newStatus);
                    } finally {
                      setIsChangingStatus(false);
                    }
                  }}
                  className="font-medium"
                >
                  {STORY_STATUS_ORDER.map((s) => (
                    <option key={s} value={s}>{STORY_STATUS_LABELS[s]}</option>
                  ))}
                </Select>
              </div>
            )}

            {/* URL de Jira */}
            {story.jiraUrl && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Tarjeta Jira</h3>
                <a
                  href={story.jiraUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:underline break-all"
                >
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  {story.jiraUrl}
                </a>
              </div>
            )}

            {/* Avance */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Avance</h3>
                <span className={clsx(
                  'text-sm font-bold',
                  story.progress > 100
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-gray-900 dark:text-white'
                )}>
                  {story.progress}%
                </span>
              </div>
              <ProgressBar value={story.progress} size="lg" />
              {story.progress > 100 && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-600 dark:text-amber-400">
                  <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    Se invirtieron <span className="font-semibold">{story.progress - 100}% más</span> de lo estimado ({story.points} pts = {story.points * 8}h)
                  </span>
                </div>
              )}
            </div>

            {/* Metadatos */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Zap className="h-4 w-4 text-indigo-500" />
                <span className="text-gray-500 dark:text-gray-400">Puntos:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{story.points}</span>
              </div>
              {story.startDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-green-500" />
                  <span className="text-gray-500 dark:text-gray-400">Inicio:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {format(parseISO(story.startDate), "d 'de' MMM yyyy", { locale: es })}
                  </span>
                </div>
              )}
              <div className={clsx('flex items-center gap-2 text-sm', isOverdue ? 'text-red-600 dark:text-red-400' : '')}>
                <Calendar className="h-4 w-4" />
                <span className={clsx(isOverdue ? '' : 'text-gray-500 dark:text-gray-400')}>Compromiso:</span>
                <span className="font-semibold">
                  {story.commitmentDate ? format(parseISO(story.commitmentDate), "d 'de' MMM yyyy", { locale: es }) : '—'}
                </span>
              </div>
              <div className="flex items-start gap-2 text-sm col-span-2">
                <User className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Responsables: </span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {assignedDevs.length > 0 ? (
                      assignedDevs.map((dev) => (
                        <Avatar key={dev.id} developer={dev} size="sm" showName />
                      ))
                    ) : (
                      <span className="text-gray-400">Sin asignar</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Historial de avances */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Historial de avances ({storyProgress.length})
                </h3>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowProgressForm(true)}
                >
                  + Registrar avance
                </Button>
              </div>
              <ProgressTimeline
                records={storyProgress}
                developers={developers}
                onEdit={onEditProgress ? (record) => setEditingRecord(record) : undefined}
                onDelete={onDeleteProgress ? (recordId) => onDeleteProgress(recordId, story.id) : undefined}
              />
            </div>
          </div>
        </div>
      </div>

      {showProgressForm && (
        <ProgressForm
          isOpen={showProgressForm}
          onClose={() => setShowProgressForm(false)}
          story={story}
          developers={developers}
          onSubmit={async (data) => {
            await onAddProgress(data);
            setShowProgressForm(false);
          }}
        />
      )}

      {editingRecord && onEditProgress && (
        <ProgressForm
          isOpen
          onClose={() => setEditingRecord(null)}
          story={story}
          developers={developers}
          editRecord={editingRecord}
          otherRecordsHours={storyProgress
            .filter((r) => r.id !== editingRecord.id)
            .reduce((sum, r) => sum + r.hoursWorked, 0)}
          onSubmit={async (data) => {
            await onEditProgress(editingRecord.id, data);
            setEditingRecord(null);
          }}
        />
      )}
    </div>
  );
};
