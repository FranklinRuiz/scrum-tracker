import type { Sprint } from '../entities/Sprint';

export interface ISprintRepository {
  getAll(): Promise<Sprint[]>;
  getById(id: string): Promise<Sprint | null>;
  save(sprint: Sprint): Promise<void>;
  update(sprint: Sprint): Promise<void>;
  delete(id: string): Promise<void>;
  getActive(): Promise<Sprint | null>;
}
