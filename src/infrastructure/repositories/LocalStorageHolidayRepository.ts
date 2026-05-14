import type { SprintHoliday } from '../../domain/entities/SprintHoliday';
import { LocalStorageAdapter } from '../persistence/LocalStorageAdapter';

const KEY = 'scrum_holidays';

export class LocalStorageHolidayRepository {
  async getAll(): Promise<SprintHoliday[]> {
    return LocalStorageAdapter.get<SprintHoliday>(KEY);
  }

  async getBySprint(sprintId: string): Promise<SprintHoliday[]> {
    const all = await this.getAll();
    return all.filter((h) => h.sprintId === sprintId);
  }

  async save(holiday: SprintHoliday): Promise<void> {
    const all = await this.getAll();
    all.push(holiday);
    LocalStorageAdapter.set(KEY, all);
  }

  async delete(id: string): Promise<void> {
    const all = await this.getAll();
    LocalStorageAdapter.set(KEY, all.filter((h) => h.id !== id));
  }

  async saveAll(holidays: SprintHoliday[]): Promise<void> {
    LocalStorageAdapter.set(KEY, holidays);
  }
}
