import type { UserStory } from '@/domain/entities/UserStory';
import type { IUserStoryRepository } from '@/domain/repositories/IUserStoryRepository';
import { LocalStorageAdapter } from '../persistence/LocalStorageAdapter';

const STORAGE_KEY = 'scrum_stories';

export class LocalStorageUserStoryRepository implements IUserStoryRepository {
  async getAll(): Promise<UserStory[]> {
    return LocalStorageAdapter.get<UserStory>(STORAGE_KEY);
  }

  async getById(id: string): Promise<UserStory | null> {
    const stories = await this.getAll();
    return stories.find((s) => s.id === id) ?? null;
  }

  async getBySprintId(sprintId: string): Promise<UserStory[]> {
    const stories = await this.getAll();
    return stories.filter((s) => s.sprintId === sprintId);
  }

  async save(story: UserStory): Promise<void> {
    const stories = await this.getAll();
    stories.push(story);
    LocalStorageAdapter.set(STORAGE_KEY, stories);
  }

  async update(story: UserStory): Promise<void> {
    const stories = await this.getAll();
    const index = stories.findIndex((s) => s.id === story.id);
    if (index === -1) throw new Error(`UserStory not found: ${story.id}`);
    stories[index] = story;
    LocalStorageAdapter.set(STORAGE_KEY, stories);
  }

  async delete(id: string): Promise<void> {
    const stories = await this.getAll();
    LocalStorageAdapter.set(
      STORAGE_KEY,
      stories.filter((s) => s.id !== id)
    );
  }

  async saveAll(stories: UserStory[]): Promise<void> {
    LocalStorageAdapter.set(STORAGE_KEY, stories);
  }
}
