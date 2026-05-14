import type { UserStory } from '../entities/UserStory';

export interface IUserStoryRepository {
  getAll(): Promise<UserStory[]>;
  getById(id: string): Promise<UserStory | null>;
  getBySprintId(sprintId: string): Promise<UserStory[]>;
  save(story: UserStory): Promise<void>;
  update(story: UserStory): Promise<void>;
  delete(id: string): Promise<void>;
}
