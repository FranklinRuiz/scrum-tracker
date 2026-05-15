import type { ProgressRecord } from '../entities/ProgressRecord';

export interface IProgressRepository {
  getAll(): Promise<ProgressRecord[]>;
  getById(id: string): Promise<ProgressRecord | null>;
  getByStoryId(storyId: string): Promise<ProgressRecord[]>;
  getByDeveloperId(developerId: string): Promise<ProgressRecord[]>;
  save(record: ProgressRecord): Promise<void>;
  update(record: ProgressRecord): Promise<void>;
  delete(id: string): Promise<void>;
}
