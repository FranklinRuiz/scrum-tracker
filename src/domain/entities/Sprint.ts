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

/** Cuenta los días hábiles (lunes–viernes) entre dos fechas ISO, inclusivo. */
export function getWorkingDays(startDate: string, endDate: string): number {
  const start = new Date(startDate + 'T12:00:00');
  const end = new Date(endDate + 'T12:00:00');
  let count = 0;
  const current = new Date(start);
  while (current <= end) {
    const dow = current.getDay();
    if (dow !== 0 && dow !== 6) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

/**
 * Calcula los días efectivos reales de un sprint descontando feriados.
 * @param startDate - fecha inicio del sprint (ISO date)
 * @param endDate - fecha fin del sprint (ISO date)
 * @param holidayCount - número de feriados dentro del sprint
 */
export function getEffectiveDays(startDate: string, endDate: string, holidayCount: number): number {
  return Math.max(0, getWorkingDays(startDate, endDate) - holidayCount);
}

/**
 * Calcula la capacidad de un desarrollador en un sprint.
 * @param effectiveDays - días efectivos del sprint (ya descontados feriados)
 * @param daysOff - días de ausencia del desarrollador (vacaciones, término, etc.)
 */
export function getDevCapacity(effectiveDays: number, daysOff: number): number {
  return Math.max(0, effectiveDays - daysOff);
}

/** @deprecated usar getWorkingDays() con las fechas del sprint */
export const BASE_EFFECTIVE_DAYS = 8;
/** @deprecated usar getWorkingDays() con las fechas del sprint */
export const EFFECTIVE_SPRINT_DAYS = BASE_EFFECTIVE_DAYS;
