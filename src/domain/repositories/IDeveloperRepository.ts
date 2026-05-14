import type { Developer } from '../entities/Developer';

export interface IDeveloperRepository {
  getAll(): Promise<Developer[]>;
  getById(id: string): Promise<Developer | null>;
  save(developer: Developer): Promise<void>;
  update(developer: Developer): Promise<void>;
  delete(id: string): Promise<void>;
  getActive(): Promise<Developer[]>;
}
