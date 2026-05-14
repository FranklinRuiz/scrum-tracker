import type { Sprint } from '../../domain/entities/Sprint';
import type { ISprintRepository } from '../../domain/repositories/ISprintRepository';
import { LocalStorageAdapter } from '../persistence/LocalStorageAdapter';

const STORAGE_KEY = 'scrum_sprints';

export class LocalStorageSprintRepository implements ISprintRepository {
  async getAll(): Promise<Sprint[]> {
    return LocalStorageAdapter.get<Sprint>(STORAGE_KEY);
  }

  async getById(id: string): Promise<Sprint | null> {
    const sprints = await this.getAll();
    return sprints.find((s) => s.id === id) ?? null;
  }

  async save(sprint: Sprint): Promise<void> {
    const sprints = await this.getAll();
    sprints.push(sprint);
    LocalStorageAdapter.set(STORAGE_KEY, sprints);
  }

  async update(sprint: Sprint): Promise<void> {
    const sprints = await this.getAll();
    const index = sprints.findIndex((s) => s.id === sprint.id);
    if (index === -1) throw new Error(`Sprint not found: ${sprint.id}`);
    sprints[index] = sprint;
    LocalStorageAdapter.set(STORAGE_KEY, sprints);
  }

  async delete(id: string): Promise<void> {
    const sprints = await this.getAll();
    LocalStorageAdapter.set(
      STORAGE_KEY,
      sprints.filter((s) => s.id !== id)
    );
  }

  async getActive(): Promise<Sprint | null> {
    const sprints = await this.getAll();
    return sprints.find((s) => s.status === 'active') ?? null;
  }

  async saveAll(sprints: Sprint[]): Promise<void> {
    LocalStorageAdapter.set(STORAGE_KEY, sprints);
  }
}
