import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import type { Sprint } from '@/domain/entities/Sprint';
import type { CreateSprintInput } from '@/application/use-cases/sprint/CreateSprintUseCase';

interface SprintFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateSprintInput) => Promise<void>;
  initialData?: Sprint;
  isLoading?: boolean;
}

export const SprintForm: React.FC<SprintFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
}) => {
  const [name, setName] = useState(initialData?.name ?? '');
  const [goal, setGoal] = useState(initialData?.goal ?? '');
  const [startDate, setStartDate] = useState(initialData?.startDate ?? '');
  const [endDate, setEndDate] = useState(initialData?.endDate ?? '');
  const [committedPoints, setCommittedPoints] = useState(
    initialData?.committedPoints?.toString() ?? '0'
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'El nombre del sprint es requerido';
    if (!goal.trim()) newErrors.goal = 'El objetivo del sprint es requerido';
    if (!startDate) newErrors.startDate = 'La fecha de inicio es requerida';
    if (!endDate) newErrors.endDate = 'La fecha de fin es requerida';
    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      newErrors.endDate = 'La fecha de fin debe ser posterior a la de inicio';
    }
    const pts = parseInt(committedPoints, 10);
    if (isNaN(pts) || pts < 0) newErrors.committedPoints = 'Debe ser un número no negativo';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({
      name: name.trim(),
      goal: goal.trim(),
      startDate,
      endDate,
      committedPoints: parseInt(committedPoints, 10),
    });
    onClose();
  };

  const inputClass =
    'w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';
  const errorClass = 'text-red-500 text-xs mt-1';
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Editar Sprint' : 'Nuevo Sprint'}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button variant="primary" isLoading={isLoading} onClick={handleSubmit}>
            {initialData ? 'Guardar cambios' : 'Crear Sprint'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Nombre del Sprint *</label>
          <input
            type="text"
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ej. Sprint 14 - Flujo de pago"
          />
          {errors.name && <p className={errorClass}>{errors.name}</p>}
        </div>

        <div>
          <label className={labelClass}>Objetivo del Sprint *</label>
          <textarea
            className={`${inputClass} resize-none`}
            rows={2}
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="¿Cuál es el objetivo principal de este sprint?"
          />
          {errors.goal && <p className={errorClass}>{errors.goal}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Fecha de inicio *</label>
            <input
              type="date"
              className={inputClass}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            {errors.startDate && <p className={errorClass}>{errors.startDate}</p>}
          </div>
          <div>
            <label className={labelClass}>Fecha de fin *</label>
            <input
              type="date"
              className={inputClass}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            {errors.endDate && <p className={errorClass}>{errors.endDate}</p>}
          </div>
        </div>

        <div>
          <label className={labelClass}>Puntos comprometidos</label>
          <input
            type="number"
            min="0"
            className={inputClass}
            value={committedPoints}
            onChange={(e) => setCommittedPoints(e.target.value)}
          />
          {errors.committedPoints && <p className={errorClass}>{errors.committedPoints}</p>}
        </div>
      </form>
    </Modal>
  );
};
