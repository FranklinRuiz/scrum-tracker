import type { Developer } from '../../domain/entities/Developer';
import type { IDeveloperRepository } from '../../domain/repositories/IDeveloperRepository';
import { LocalStorageAdapter } from '../persistence/LocalStorageAdapter';

const STORAGE_KEY = 'scrum_developers';

export class LocalStorageDeveloperRepository implements IDeveloperRepository {
  async getAll(): Promise<Developer[]> {
    return LocalStorageAdapter.get<Developer>(STORAGE_KEY);
  }

  async getById(id: string): Promise<Developer | null> {
    const devs = await this.getAll();
    return devs.find((d) => d.id === id) ?? null;
  }

  async save(developer: Developer): Promise<void> {
    const devs = await this.getAll();
    devs.push(developer);
    LocalStorageAdapter.set(STORAGE_KEY, devs);
  }

  async update(developer: Developer): Promise<void> {
    const devs = await this.getAll();
    const index = devs.findIndex((d) => d.id === developer.id);
    if (index === -1) throw new Error(`Developer not found: ${developer.id}`);
    devs[index] = developer;
    LocalStorageAdapter.set(STORAGE_KEY, devs);
  }

  async delete(id: string): Promise<void> {
    const devs = await this.getAll();
    LocalStorageAdapter.set(
      STORAGE_KEY,
      devs.filter((d) => d.id !== id)
    );
  }

  async getActive(): Promise<Developer[]> {
    const devs = await this.getAll();
    return devs.filter((d) => d.isActive);
  }

  async saveAll(developers: Developer[]): Promise<void> {
    LocalStorageAdapter.set(STORAGE_KEY, developers);
  }
}
