export type AbsenceReason = 'vacaciones' | 'termino' | 'licencia' | 'otro';

export interface DeveloperAvailability {
  id: string;
  sprintId: string;
  developerId: string;
  daysOff: number;       // días que el dev NO estará disponible en este sprint
  reason: AbsenceReason;
  notes: string;
}

export const ABSENCE_REASON_LABELS: Record<AbsenceReason, string> = {
  vacaciones: 'Vacaciones',
  termino: 'Término de contrato',
  licencia: 'Licencia',
  otro: 'Otro',
};
