import React, { useMemo, useState } from 'react';
import { format, parseISO, eachDayOfInterval, isWeekend } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';
import { useAppStore } from '../store/useAppStore';
import { SprintSelector } from '../components/sprint/SprintSelector';
import { Badge } from '../components/common/Badge';
import { Avatar } from '../components/common/Avatar';
import { EmptyState } from '../components/common/EmptyState';
import { StoryDetail } from '../components/story/StoryDetail';
import { STORY_STATUS_COLORS, STORY_STATUS_LABELS, isTerminalStatus } from '@/domain/value-objects/StoryStatus.ts';
import { PRIORITY_COLORS } from '@/domain/value-objects/Priority.ts';
import type { UserStory } from '@/domain/entities/UserStory.ts';
import type { StoryStatus } from '@/domain/value-objects/StoryStatus.ts';
import toast from 'react-hot-toast';

export const TimelinePage: React.FC = () => {
  const {
    sprints,
    stories,
    progressRecords,
    developers,
    selectedSprintId,
    setSelectedSprint,
    addProgress,
    editProgress,
    deleteProgress,
  } = useAppStore();

  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const selectedStory = selectedStoryId ? (stories.find((s) => s.id === selectedStoryId) ?? null) : null;

  const selectedSprint = useMemo(
    () => sprints.find((s) => s.id === selectedSprintId) ?? null,
    [sprints, selectedSprintId]
  );

  const sprintStories = useMemo(
    () => (selectedSprintId ? stories.filter((s) => s.sprintId === selectedSprintId) : []),
    [stories, selectedSprintId]
  );

  // Only weekdays (Mon–Fri) in the sprint range
  const timelineDays = useMemo(() => {
    if (!selectedSprint) return [];
    const start = parseISO(selectedSprint.startDate);
    const end = parseISO(selectedSprint.endDate);
    return eachDayOfInterval({ start, end }).filter((d) => !isWeekend(d));
  }, [selectedSprint]);

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  // ── Position helpers ─────────────────────────────────────────────────────
  // All comparisons via 'yyyy-MM-dd' strings to avoid timezone issues.
  const ds = (d: Date | string): string =>
    typeof d === 'string' ? d.substring(0, 10) : format(d, 'yyyy-MM-dd');

  // Number of weekday columns strictly before a given date
  const weekdaysBefore = (date: Date | string): number =>
    timelineDays.filter((td) => format(td, 'yyyy-MM-dd') < ds(date)).length;

  // Number of weekday columns in [from, to] inclusive
  const weekdaysInRange = (from: Date | string, to: Date | string): number =>
    timelineDays.filter((td) => {
      const s = format(td, 'yyyy-MM-dd');
      return s >= ds(from) && s <= ds(to);
    }).length;

  const handleAddProgress = async (data: {
    storyId: string;
    developerId: string;
    hoursWorked: number;
    comment: string;
    newStatus: StoryStatus;
    commitmentMet: boolean;
  }) => {
    try {
      await addProgress(data);
      toast.success('Avance registrado');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al registrar avance');
    }
  };

  const handleEditProgress = async (recordId: string, data: {
    storyId: string; developerId: string; hoursWorked: number;
    comment: string; newStatus: StoryStatus; commitmentMet: boolean;
  }) => {
    try {
      await editProgress({ recordId, ...data });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al editar avance');
    }
  };

  const handleDeleteProgress = async (recordId: string, storyId: string) => {
    try {
      await deleteProgress(recordId, storyId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar avance');
    }
  };

  const selectedStoryProgressRecords = selectedStory
    ? progressRecords.filter((p) => p.storyId === selectedStory.id)
    : [];

  const getStoryBarStyle = (story: UserStory) => {
    if (!selectedSprint || timelineDays.length === 0) return { left: '0%', width: '100%' };
    const total = timelineDays.length;
    const sprintStartStr = selectedSprint.startDate;
    const sprintEndStr = selectedSprint.endDate;

    // Start: startDate > fallback to createdAt, clamped to sprint start
    const rawStartStr = story.startDate
      ? ds(parseISO(story.startDate))
      : ds(parseISO(story.createdAt));
    const storyStartStr = rawStartStr > sprintStartStr ? rawStartStr : sprintStartStr;

    // If commitment was met, bar ends at the date it was met
    const metRecord = progressRecords
      .filter((p) => p.storyId === story.id && p.commitmentMet)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))[0];
    const metDateStr = metRecord ? ds(parseISO(metRecord.timestamp)) : null;

    let rawEndStr: string;
    if (isTerminalStatus(story.status) || metDateStr) {
      // Done: end at met date or commitment date
      rawEndStr = metDateStr ?? (story.commitmentDate ? ds(parseISO(story.commitmentDate)) : sprintEndStr);
    } else {
      // In progress: end at today (clamped to sprint end)
      rawEndStr = todayStr <= sprintEndStr ? todayStr : sprintEndStr;
    }
    const storyEndStr = rawEndStr <= sprintEndStr ? rawEndStr : sprintEndStr;

    const startIdx = weekdaysBefore(storyStartStr);
    const span = Math.max(1, weekdaysInRange(storyStartStr, storyEndStr));
    const minWidth = (1 / total) * 100;

    return {
      left: `${(startIdx / total) * 100}%`,
      width: `${Math.max((span / total) * 100, minWidth)}%`,
    };
  };

  // Today marker: center of the today column (if it's a weekday within the sprint)
  const getTodayPosition = (): number | null => {
    if (!selectedSprint || timelineDays.length === 0) return null;
    const total = timelineDays.length;
    const idx = timelineDays.findIndex((d) => format(d, 'yyyy-MM-dd') === todayStr);
    if (idx !== -1) return ((idx + 0.5) / total) * 100;

    // Weekend or out of range: place the marker between adjacent weekday columns
    if (todayStr < ds(timelineDays[0]) || todayStr > ds(timelineDays[total - 1])) return null;
    const before = weekdaysBefore(todayStr);
    return (before / total) * 100;
  };

  const todayPosition = getTodayPosition();

  const getStatusBarColor = (story: UserStory): string => {
    if (story.isBlocked) return 'bg-red-500 dark:bg-red-600';
    switch (story.status) {
      case 'done-prd':          return 'bg-emerald-500 dark:bg-emerald-600';
      case 'finalized':         return 'bg-green-500 dark:bg-green-600';
      case 'pase-management':   return 'bg-orange-500 dark:bg-orange-600';
      case 'done-certification':return 'bg-violet-500 dark:bg-violet-600';
      case 'in-certification':  return 'bg-purple-500 dark:bg-purple-600';
      case 'done-development':  return 'bg-cyan-500 dark:bg-cyan-600';
      case 'in-development':    return 'bg-blue-500 dark:bg-blue-600';
      case 'blocked':           return 'bg-red-500 dark:bg-red-600';
      default:                  return 'bg-gray-400 dark:bg-gray-500';
    }
  };

  const storyIdsWithCommitmentMet = useMemo(
    () => new Set(progressRecords.filter((p) => p.commitmentMet).map((p) => p.storyId)),
    [progressRecords]
  );
  const isStoryDone = (s: UserStory) =>
    isTerminalStatus(s.status) || storyIdsWithCommitmentMet.has(s.id);

  const sortedStories = useMemo(() => {
    return [...sprintStories].sort((a, b) => {
      if (a.isBlocked !== b.isBlocked) return a.isBlocked ? -1 : 1;
      const priorityMap = { critical: 0, high: 1, medium: 2, low: 3 };
      if (priorityMap[a.priority] !== priorityMap[b.priority])
        return priorityMap[a.priority] - priorityMap[b.priority];
      return a.commitmentDate.localeCompare(b.commitmentDate);
    });
  }, [sprintStories]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="w-72">
            <SprintSelector
              sprints={sprints}
              selectedId={selectedSprintId}
              onSelect={setSelectedSprint}
            />
          </div>
          {selectedSprint && (
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>
                  {format(parseISO(selectedSprint.startDate), "d 'de' MMM", { locale: es })}
                  {' – '}
                  {format(parseISO(selectedSprint.endDate), "d 'de' MMM yyyy", { locale: es })}
                </span>
              </div>
              <span className="text-gray-300 dark:text-gray-600">·</span>
              <span>{sprintStories.length} historias</span>
              <span className="text-gray-300 dark:text-gray-600">·</span>
              <span>{selectedSprint.committedPoints} puntos comprometidos</span>
              <span className="text-gray-300 dark:text-gray-600">·</span>
              <span>{timelineDays.length} días hábiles</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {!selectedSprintId ? (
          <div className="p-6">
            <EmptyState
              icon={<Calendar className="h-16 w-16" />}
              title="Selecciona un sprint"
              description="Elige un sprint para ver su línea de tiempo y el avance de las historias."
            />
          </div>
        ) : sprintStories.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<Calendar className="h-16 w-16" />}
              title="Sin historias"
              description="Este sprint no tiene historias aún. Agrégalas desde el módulo de Historias."
            />
          </div>
        ) : (
          <div className="py-4 space-y-4">
            {/* Legend */}
            <div className="px-6 flex items-center gap-4 flex-wrap">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Referencia:</span>
              {[
                { color: 'bg-emerald-500', label: 'Done PRD' },
                { color: 'bg-green-500',   label: 'Finalizado' },
                { color: 'bg-orange-500',  label: 'Gestión de pase' },
                { color: 'bg-violet-500',  label: 'Done Certificación' },
                { color: 'bg-purple-500',  label: 'En Certificación' },
                { color: 'bg-cyan-500',    label: 'Done Desarrollo' },
                { color: 'bg-blue-500',    label: 'En Desarrollo' },
                { color: 'bg-gray-400',    label: 'Abierto' },
                { color: 'bg-red-500',     label: 'Bloqueado' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className={clsx('h-3 w-3 rounded', color)} />
                  <span className="text-xs text-gray-600 dark:text-gray-400">{label}</span>
                </div>
              ))}
            </div>

            {/* Gantt-style timeline — full width */}
            <div className="bg-white dark:bg-slate-800 border-y border-gray-200 dark:border-slate-700 overflow-hidden">
              {/* Header: weekday columns */}
              <div className="flex border-b border-gray-200 dark:border-slate-700">
                <div className="w-72 shrink-0 px-4 py-3 border-r border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Historia
                  </span>
                </div>
                <div className="flex-1 overflow-x-auto">
                  <div
                    className="flex"
                    style={{ minWidth: `${timelineDays.length * 48}px` }}
                  >
                    {timelineDays.map((day) => {
                      const dayStr = format(day, 'yyyy-MM-dd');
                      const isToday = dayStr === todayStr;
                      return (
                        <div
                          key={dayStr}
                          className={clsx(
                            'flex-1 min-w-[48px] py-3 text-center border-r border-gray-100 dark:border-slate-700 last:border-r-0 bg-gray-50 dark:bg-slate-900/50',
                            isToday && 'bg-indigo-50 dark:bg-indigo-900/20'
                          )}
                        >
                          <div
                            className={clsx(
                              'text-xs font-semibold',
                              isToday
                                ? 'text-indigo-600 dark:text-indigo-400'
                                : 'text-gray-700 dark:text-gray-300'
                            )}
                          >
                            {format(day, 'd')}
                          </div>
                          <div
                            className={clsx(
                              'text-[10px] capitalize',
                              isToday
                                ? 'text-indigo-500 dark:text-indigo-400'
                                : 'text-gray-400 dark:text-gray-500'
                            )}
                          >
                            {format(day, 'EEE', { locale: es })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Story rows */}
              {sortedStories.map((story) => {
                const assignedDevs = developers.filter((d) => story.assignees.includes(d.id));

                return (
                  <div
                    key={story.id}
                    className="flex border-b border-gray-100 dark:border-slate-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    {/* Story info column */}
                    <div
                      className="w-72 shrink-0 px-4 py-3 border-r border-gray-200 dark:border-slate-700 cursor-pointer"
                      onClick={() => setSelectedStoryId(story.id)}
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                            <Badge className={PRIORITY_COLORS[story.priority]}>
                              {story.priority}
                            </Badge>
                            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                              {story.points}pt
                            </span>
                            {story.isBlocked && (
                              <AlertTriangle className="h-3.5 w-3.5 text-red-500 animate-pulse" />
                            )}
                          </div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                            {story.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge className={STORY_STATUS_COLORS[story.status]}>
                              {STORY_STATUS_LABELS[story.status]}
                            </Badge>
                            {story.startDate && (
                              <span className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-0.5">
                                <Calendar className="h-3 w-3" />
                                {format(parseISO(story.startDate), "d 'de' MMM", { locale: es })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {assignedDevs.length > 0 && (
                        <div className="flex items-center gap-1 mt-2 -space-x-1">
                          {assignedDevs.slice(0, 3).map((dev) => (
                            <div
                              key={dev.id}
                              className="ring-2 ring-white dark:ring-slate-800 rounded-full"
                            >
                              <Avatar developer={dev} size="xs" />
                            </div>
                          ))}
                          {assignedDevs.length > 3 && (
                            <span className="text-xs text-gray-400 dark:text-gray-500 pl-2">
                              +{assignedDevs.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Timeline bar area */}
                    <div className="flex-1 overflow-x-auto">
                      <div
                        className="relative flex items-center"
                        style={{ minWidth: `${timelineDays.length * 48}px`, height: '100%', minHeight: '80px' }}
                      >
                        {/* Vertical day grid lines */}
                        {timelineDays.map((day, i) => {
                          const isToday = format(day, 'yyyy-MM-dd') === todayStr;
                          return (
                            <div
                              key={i}
                              className={clsx(
                                'absolute top-0 bottom-0 border-r border-gray-100 dark:border-slate-700',
                                isToday && 'bg-indigo-50/30 dark:bg-indigo-900/10'
                              )}
                              style={{
                                left: `${(i / timelineDays.length) * 100}%`,
                                width: `${(1 / timelineDays.length) * 100}%`,
                              }}
                            />
                          );
                        })}

                        {/* Today marker line */}
                        {todayPosition !== null && (
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-indigo-500 dark:bg-indigo-400 z-20"
                            style={{ left: `${todayPosition}%` }}
                          >
                            <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 h-2 w-2 bg-indigo-500 rounded-full" />
                          </div>
                        )}

                        {/* Story bar */}
                        <div
                          className="absolute z-10 flex items-center gap-2 cursor-pointer"
                          style={getStoryBarStyle(story)}
                          onClick={() => setSelectedStoryId(story.id)}
                        >
                          <div
                            className={clsx(
                              'w-full h-7 rounded-md flex items-center gap-1.5 shadow-sm transition-all hover:shadow-md',
                              getStatusBarColor(story),
                              story.isBlocked && 'animate-pulse'
                            )}
                          >
                            <div className="relative flex-1 h-full flex items-center justify-end overflow-hidden rounded">
                              <div
                                className="absolute left-0 top-0 bottom-0 bg-white/20 rounded"
                                style={{ width: `${Math.min(100, story.progress)}%` }}
                              />
                              <span className="relative text-white text-xs font-semibold truncate px-1">
                                Avance al {story.progress}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary stats */}
            <div className="px-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  label: 'Total historias',
                  value: sprintStories.length,
                  color: 'text-gray-900 dark:text-white',
                  bg: 'bg-white dark:bg-slate-800',
                },
                {
                  label: 'Completadas',
                  value: sprintStories.filter(isStoryDone).length,
                  color: 'text-green-600 dark:text-green-400',
                  bg: 'bg-green-50 dark:bg-green-900/20',
                },
                {
                  label: 'Bloqueadas',
                  value: sprintStories.filter((s) => s.isBlocked).length,
                  color: 'text-red-600 dark:text-red-400',
                  bg: 'bg-red-50 dark:bg-red-900/20',
                },
                {
                  label: 'Vencidas',
                  value: sprintStories.filter(
                    (s) =>
                      !isStoryDone(s) &&
                      s.commitmentDate &&
                      ds(parseISO(s.commitmentDate)) < todayStr
                  ).length,
                  color: 'text-amber-600 dark:text-amber-400',
                  bg: 'bg-amber-50 dark:bg-amber-900/20',
                },
              ].map(({ label, value, color, bg }) => (
                <div
                  key={label}
                  className={clsx(
                    'rounded-xl p-4 border border-gray-200 dark:border-slate-700',
                    bg
                  )}
                >
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</p>
                  <p className={clsx('text-3xl font-bold', color)}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Story Detail Panel */}
      {selectedStory && (
        <StoryDetail
          story={selectedStory}
          developers={developers}
          progressRecords={selectedStoryProgressRecords}
          onClose={() => setSelectedStoryId(null)}
          onAddProgress={handleAddProgress}
          onEditProgress={handleEditProgress}
          onDeleteProgress={handleDeleteProgress}
          onEdit={() => setSelectedStoryId(null)}
        />
      )}
    </div>
  );
};
