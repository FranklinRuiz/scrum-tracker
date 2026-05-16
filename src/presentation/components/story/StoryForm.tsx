import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Select } from '../common/Select';
import type { UserStory } from '@/domain/entities/UserStory';
import type { Sprint } from '@/domain/entities/Sprint';
import type { Developer } from '@/domain/entities/Developer';
import type { CreateStoryInput } from '@/application/use-cases/story/CreateStoryUseCase';
import { STORY_STATUS_ORDER, STORY_STATUS_LABELS } from '@/domain/value-objects/StoryStatus';
import type { Priority } from '@/domain/value-objects/Priority';
import type { StoryStatus } from '@/domain/value-objects/StoryStatus';

interface StoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateStoryInput & { status?: StoryStatus; progress?: number; isBlocked?: boolean; blockReason?: string }) => Promise<void>;
  initialData?: UserStory;
  sprints: Sprint[];
  developers: Developer[];
  defaultSprintId?: string;
  isLoading?: boolean;
}

const PRIORITIES: Priority[] = ['critical', 'high', 'medium', 'low'];
const PRIORITY_LABELS_ES: Record<Priority, string> = {
  critical: 'Crítica',
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
};

export const StoryForm: React.FC<StoryFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  sprints,
  developers,
  defaultSprintId,
  isLoading = false,
}) => {
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [jiraUrl, setJiraUrl] = useState(initialData?.jiraUrl ?? '');
  const [priority, setPriority] = useState<Priority>(initialData?.priority ?? 'medium');
  const [points, setPoints] = useState(initialData?.points?.toString() ?? '');
  const [sprintId, setSprintId] = useState(initialData?.sprintId ?? defaultSprintId ?? '');
  const [startDate, setStartDate] = useState(initialData?.startDate ?? '');
  const [commitmentDate, setCommitmentDate] = useState(initialData?.commitmentDate ?? '');
  const [assignees, setAssignees] = useState<string[]>(initialData?.assignees ?? []);
  const [status, setStatus] = useState<StoryStatus>(initialData?.status ?? 'open');
  const [progress, setProgress] = useState(initialData?.progress?.toString() ?? '0');
  const [isBlocked, setIsBlocked] = useState(initialData?.isBlocked ?? false);
  const [blockReason, setBlockReason] = useState(initialData?.blockReason ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;
    if (initialData) {
      setTitle(initialData.title);
      setJiraUrl(initialData.jiraUrl ?? '');
      setPriority(initialData.priority ?? 'medium');
      setPoints(initialData.points?.toString() ?? '');
      setSprintId(initialData.sprintId ?? defaultSprintId ?? '');
      setStartDate(initialData.startDate ?? '');
      setCommitmentDate(initialData.commitmentDate ?? '');
      setAssignees(initialData.assignees ?? []);
      setStatus(initialData.status ?? 'open');
      setProgress(initialData.progress?.toString() ?? '0');
      setIsBlocked(initialData.isBlocked ?? false);
      setBlockReason(initialData.blockReason ?? '');
    } else {
      setTitle('');
      setJiraUrl('');
      setPriority('medium');
      setPoints('');
      setSprintId(defaultSprintId ?? '');
      setStartDate('');
      setCommitmentDate('');
      setAssignees([]);
      setStatus('open');
      setProgress('0');
      setIsBlocked(false);
      setBlockReason('');
    }
    setErrors({});
  }, [isOpen]);

  const toggleAssignee = (devId: string) => {
    setAssignees((prev) =>
      prev.includes(devId) ? prev.filter((id) => id !== devId) : [...prev, devId]
    );
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Title is required';
    if (!sprintId) errs.sprintId = 'Sprint is required';
    if (!commitmentDate) errs.commitmentDate = 'Commitment date is required';
    const pts = parseInt(points, 10);
    if (isNaN(pts) || pts < 0) errs.points = 'Must be a non-negative number';
    const prog = parseInt(progress, 10);
    if (isNaN(prog) || prog < 0 || prog > 100) errs.progress = 'Must be between 0 and 100';
    if (isBlocked && !blockReason.trim()) errs.blockReason = 'Block reason is required when blocked';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({
      title: title.trim(),
      jiraUrl: jiraUrl.trim() || undefined,
      priority,
      points: parseInt(points, 10),
      sprintId,
      startDate: startDate || undefined,
      commitmentDate,
      assignees,
      status,
      progress: parseInt(progress, 10),
      isBlocked,
      blockReason: isBlocked ? blockReason.trim() : undefined,
    });
    onClose();
  };

  const inputClass =
    'w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';
  const errorClass = 'text-red-500 text-xs mt-1';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Editar Historia' : 'Nueva Historia de Usuario'}
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancelar</Button>
          <Button variant="primary" isLoading={isLoading} onClick={handleSubmit}>
            {initialData ? 'Guardar cambios' : 'Crear Historia'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
        <div>
          <label className={labelClass}>Título *</label>
          <input type="text" className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Como usuario quiero..." />
          {errors.title && <p className={errorClass}>{errors.title}</p>}
        </div>

        <div>
          <label className={labelClass}>URL de Jira</label>
          <input
            type="url"
            className={inputClass}
            value={jiraUrl}
            onChange={(e) => setJiraUrl(e.target.value)}
            placeholder="https://tuempresa.atlassian.net/browse/PROJ-123"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Sprint *</label>
            <Select value={sprintId} onChange={(e) => setSprintId(e.target.value)}>
              <option value="">Seleccionar sprint</option>
              {sprints.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
            {errors.sprintId && <p className={errorClass}>{errors.sprintId}</p>}
          </div>
          <div>
            <label className={labelClass}>Fecha inicio</label>
            <input type="date" className={inputClass} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Fecha compromiso *</label>
            <input type="date" className={inputClass} value={commitmentDate} onChange={(e) => setCommitmentDate(e.target.value)} />
            {errors.commitmentDate && <p className={errorClass}>{errors.commitmentDate}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Prioridad</label>
            <Select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{PRIORITY_LABELS_ES[p]}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className={labelClass}>Puntos de historia</label>
            <input
              type="number"
              min="0"
              className={inputClass}
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              placeholder="Ej: 4"
            />
            {errors.points && <p className={errorClass}>{errors.points}</p>}
          </div>
        </div>

        {initialData && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Estado</label>
              <Select value={status} onChange={(e) => setStatus(e.target.value as StoryStatus)}>
                {STORY_STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>{STORY_STATUS_LABELS[s]}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className={labelClass}>Avance (%)</label>
              <input type="number" min="0" max="100" className={inputClass} value={progress} onChange={(e) => setProgress(e.target.value)} />
              {errors.progress && <p className={errorClass}>{errors.progress}</p>}
            </div>
          </div>
        )}

        <div>
          <label className={labelClass}>Responsables</label>
          <div className="flex flex-wrap gap-2">
            {developers.map((dev) => (
              <button
                key={dev.id}
                type="button"
                onClick={() => toggleAssignee(dev.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  assignees.includes(dev.id)
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                    : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-400 hover:border-gray-400'
                }`}
              >
                {dev.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <div className="flex items-center h-5 mt-0.5">
            <input
              type="checkbox"
              id="isBlocked"
              checked={isBlocked}
              onChange={(e) => setIsBlocked(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="isBlocked" className="text-sm font-medium text-red-700 dark:text-red-400 cursor-pointer">
              Marcar como bloqueada
            </label>
            {isBlocked && (
              <div className="mt-2">
                <input
                  type="text"
                  className={inputClass}
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Describir el bloqueo..."
                />
                {errors.blockReason && <p className={errorClass}>{errors.blockReason}</p>}
              </div>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
};
