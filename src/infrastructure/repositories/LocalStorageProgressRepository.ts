import type { ProgressRecord } from '../../domain/entities/ProgressRecord';
import type { IProgressRepository } from '../../domain/repositories/IProgressRepository';
import { LocalStorageAdapter } from '../persistence/LocalStorageAdapter';

const STORAGE_KEY = 'scrum_progress';

export class LocalStorageProgressRepository implements IProgressRepository {
  async getAll(): Promise<ProgressRecord[]> {
    return LocalStorageAdapter.get<ProgressRecord>(STORAGE_KEY);
  }

  async getById(id: string): Promise<ProgressRecord | null> {
    const records = await this.getAll();
    return records.find((r) => r.id === id) ?? null;
  }

  async getByStoryId(storyId: string): Promise<ProgressRecord[]> {
    const records = await this.getAll();
    return records.filter((r) => r.storyId === storyId);
  }

  async getByDeveloperId(developerId: string): Promise<ProgressRecord[]> {
    const records = await this.getAll();
    return records.filter((r) => r.developerId === developerId);
  }

  async save(record: ProgressRecord): Promise<void> {
    const records = await this.getAll();
    records.push(record);
    LocalStorageAdapter.set(STORAGE_KEY, records);
  }

  async delete(id: string): Promise<void> {
    const records = await this.getAll();
    LocalStorageAdapter.set(
      STORAGE_KEY,
      records.filter((r) => r.id !== id)
    );
  }

  async saveAll(records: ProgressRecord[]): Promise<void> {
    LocalStorageAdapter.set(STORAGE_KEY, records);
  }
}
