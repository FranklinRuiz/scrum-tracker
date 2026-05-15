import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Select } from '../common/Select';
import type { UserStory } from '../../../domain/entities/UserStory';
import type { Developer } from '../../../domain/entities/Developer';
import type { ProgressRecord } from '../../../domain/entities/ProgressRecord';
import type { StoryStatus } from '../../../domain/value-objects/StoryStatus';
import { STORY_STATUS_ORDER, STORY_STATUS_LABELS } from '../../../domain/value-objects/StoryStatus';

interface ProgressFormProps {
  isOpen: boolean;
  onClose: () => void;
  story: UserStory;
  developers: Developer[];
  /** Cuando se pasa, el form actúa en modo edición */
  editRecord?: ProgressRecord;
  /** Suma de horas de todos los registros excepto el que se está editando */
  otherRecordsHours?: number;
  onSubmit: (data: {
    storyId: string;
    developerId: string;
    hoursWorked: number;
    comment: string;
    newStatus: StoryStatus;
    commitmentMet: boolean;
  }) => Promise<void>;
  isLoading?: boolean;
}

export const ProgressForm: React.FC<ProgressFormProps> = ({
  isOpen,
  onClose,
  story,
  developers,
  editRecord,
  otherRecordsHours = 0,
  onSubmit,
  isLoading = false,
}) => {
  const isEditMode = !!editRecord;
  const [developerId, setDeveloperId] = useState(
    editRecord?.developerId ?? story.assignees[0] ?? developers[0]?.id ?? ''
  );
  const [hoursWorked, setHoursWorked] = useState(
    editRecord ? editRecord.hoursWorked.toString() : '1'
  );
  const [comment, setComment] = useState(editRecord?.comment ?? '');
  const [newStatus, setNewStatus] = useState<StoryStatus>(editRecord?.newStatus ?? story.status);
  const [commitmentMet, setCommitmentMet] = useState(editRecord?.commitmentMet ?? false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const hoursPerPoint = 8;
  const previewHours = parseFloat(hoursWorked) || 0;
  const baseHours = isEditMode ? otherRecordsHours : story.progress * (story.points * hoursPerPoint) / 100;
  const projectedProgress = story.points > 0
    ? Math.round(((baseHours + previewHours) / (story.points * hoursPerPoint)) * 100)
    : 0;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!developerId) errs.developerId = 'Developer is required';
    const hrs = parseFloat(hoursWorked);
    if (isNaN(hrs) || hrs < 0) errs.hoursWorked = 'Must be a non-negative number';
    if (!comment.trim()) errs.comment = 'Comment is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({
      storyId: story.id,
      developerId,
      hoursWorked: parseFloat(hoursWorked),
      comment: comment.trim(),
      newStatus,
      commitmentMet,
    });
  };

  const inputClass =
    'w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';
  const errorClass = 'text-red-500 text-xs mt-1';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Editar avance' : 'Registrar avance'}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancelar</Button>
          <Button variant="primary" isLoading={isLoading} onClick={handleSubmit}>
            {isEditMode ? 'Guardar cambios' : 'Guardar avance'}
          </Button>
        </>
      }
    >
      <div className="mb-4 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{story.title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Avance actual: {story.progress}% — {story.points} pts ({story.points * hoursPerPoint}h capacidad) — Estado: {STORY_STATUS_LABELS[story.status]}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Desarrollador *</label>
          <Select value={developerId} onChange={(e) => setDeveloperId(e.target.value)}>
            <option value="">Seleccionar desarrollador</option>
            {developers.map((dev) => (
              <option key={dev.id} value={dev.id}>{dev.name} — {dev.role}</option>
            ))}
          </Select>
          {errors.developerId && <p className={errorClass}>{errors.developerId}</p>}
        </div>

        <div>
          <label className={labelClass}>Horas trabajadas</label>
          <input
            type="number"
            min="0"
            step="0.5"
            className={inputClass}
            value={hoursWorked}
            onChange={(e) => setHoursWorked(e.target.value)}
          />
          {errors.hoursWorked && <p className={errorClass}>{errors.hoursWorked}</p>}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Avance proyectado:{' '}
            <span className={`font-medium ${projectedProgress > 100 ? 'text-amber-600 dark:text-amber-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
              {projectedProgress}%
            </span>
            {projectedProgress > 100 && (
              <span className="ml-1 text-amber-500 dark:text-amber-400">(supera el estimado)</span>
            )}
            {' '}(1 punto = {hoursPerPoint}h)
          </p>
        </div>

        <div>
          <label className={labelClass}>Nuevo estado</label>
          <Select value={newStatus} onChange={(e) => setNewStatus(e.target.value as StoryStatus)}>
            {STORY_STATUS_ORDER.map((s) => (
              <option key={s} value={s}>{STORY_STATUS_LABELS[s]}</option>
            ))}
          </Select>
        </div>

        <div>
          <label className={labelClass}>Comentario *</label>
          <textarea
            className={`${inputClass} resize-none`}
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="¿En qué trabajaste? ¿Hay algún bloqueo?"
          />
          {errors.comment && <p className={errorClass}>{errors.comment}</p>}
        </div>

        <button
          type="button"
          onClick={() => setCommitmentMet((v) => !v)}
          className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-colors text-left ${
            commitmentMet
              ? 'border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-600'
              : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
          }`}
        >
          <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
            commitmentMet
              ? 'border-green-500 bg-green-500 dark:border-green-600 dark:bg-green-600'
              : 'border-gray-300 dark:border-slate-500'
          }`}>
            {commitmentMet && <CheckCircle2 className="h-4 w-4 text-white" />}
          </div>
          <div>
            <p className={`text-sm font-medium ${commitmentMet ? 'text-green-700 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}>
              Compromiso cumplido
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              El avance registrado cumple con el compromiso del sprint
            </p>
          </div>
        </button>
      </form>
    </Modal>
  );
};
