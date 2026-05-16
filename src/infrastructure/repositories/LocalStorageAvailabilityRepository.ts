import type { DeveloperAvailability } from '@/domain/entities/DeveloperAvailability';
import { LocalStorageAdapter } from '../persistence/LocalStorageAdapter';

const KEY = 'scrum_availability';

export class LocalStorageAvailabilityRepository {
  async getAll(): Promise<DeveloperAvailability[]> {
    return LocalStorageAdapter.get<DeveloperAvailability>(KEY);
  }

  async getBySprint(sprintId: string): Promise<DeveloperAvailability[]> {
    const all = await this.getAll();
    return all.filter((a) => a.sprintId === sprintId);
  }

  async getBySprintAndDeveloper(sprintId: string, developerId: string): Promise<DeveloperAvailability | null> {
    const all = await this.getAll();
    return all.find((a) => a.sprintId === sprintId && a.developerId === developerId) ?? null;
  }

  async save(availability: DeveloperAvailability): Promise<void> {
    const all = await this.getAll();
    all.push(availability);
    LocalStorageAdapter.set(KEY, all);
  }

  async update(availability: DeveloperAvailability): Promise<void> {
    const all = await this.getAll();
    const idx = all.findIndex((a) => a.id === availability.id);
    if (idx === -1) throw new Error(`Availability not found: ${availability.id}`);
    all[idx] = availability;
    LocalStorageAdapter.set(KEY, all);
  }

  async delete(id: string): Promise<void> {
    const all = await this.getAll();
    LocalStorageAdapter.set(KEY, all.filter((a) => a.id !== id));
  }

  async saveAll(records: DeveloperAvailability[]): Promise<void> {
    LocalStorageAdapter.set(KEY, records);
  }
}
