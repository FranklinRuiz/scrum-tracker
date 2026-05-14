import type { Sprint } from '../../domain/entities/Sprint';
import type { UserStory } from '../../domain/entities/UserStory';
import type { ProgressRecord } from '../../domain/entities/ProgressRecord';
import type { Developer } from '../../domain/entities/Developer';
import type { SprintHoliday } from '../../domain/entities/SprintHoliday';
import type { DeveloperAvailability } from '../../domain/entities/DeveloperAvailability';

export interface BackupData {
  version: string;
  exportedAt: string;
  sprints: Sprint[];
  stories: UserStory[];
  progressRecords: ProgressRecord[];
  developers: Developer[];
  holidays: SprintHoliday[];
  availability: DeveloperAvailability[];
}

export class BackupService {
  static exportToJson(data: BackupData): void {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `scrum-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  static importFromJson(file: File): Promise<BackupData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const data = JSON.parse(text) as BackupData;
          if (!data.sprints || !data.stories || !data.progressRecords || !data.developers) {
            reject(new Error('Archivo de backup inválido: faltan campos requeridos'));
            return;
          }
          // Backward compat: old backups without holidays/availability
          if (!data.holidays) data.holidays = [];
          if (!data.availability) data.availability = [];
          resolve(data);
        } catch {
          reject(new Error('Error al leer el archivo: JSON inválido'));
        }
      };
      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsText(file);
    });
  }
}
