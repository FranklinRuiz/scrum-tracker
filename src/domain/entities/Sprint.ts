export type SprintStatus = 'planned' | 'active' | 'completed';

export interface Sprint {
  id: string;
  name: string;
  goal: string;
  startDate: string; // ISO date
  endDate: string;   // ISO date
  committedPoints: number;
  status: SprintStatus;
  createdAt: string;
  updatedAt: string;
}

/** Días base efectivos de un sprint de 2 semanas (10 laborables - primer y último día) */
export const BASE_EFFECTIVE_DAYS = 8;

/**
 * Calcula los días efectivos reales de un sprint descontando feriados.
 * @param holidayCount - número de feriados dentro del sprint
 */
export function getEffectiveDays(holidayCount: number): number {
  return Math.max(0, BASE_EFFECTIVE_DAYS - holidayCount);
}

/**
 * Calcula la capacidad de un desarrollador en un sprint.
 * @param effectiveDays - días efectivos del sprint (ya descontados feriados)
 * @param daysOff - días de ausencia del desarrollador (vacaciones, término, etc.)
 */
export function getDevCapacity(effectiveDays: number, daysOff: number): number {
  return Math.max(0, effectiveDays - daysOff);
}

/** @deprecated usar getEffectiveDays(0) — mantenido para compatibilidad */
export const EFFECTIVE_SPRINT_DAYS = BASE_EFFECTIVE_DAYS;
