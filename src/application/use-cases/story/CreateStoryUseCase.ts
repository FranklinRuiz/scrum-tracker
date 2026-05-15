import { v4 as uuidv4 } from 'uuid';
import type { UserStory } from '../../../domain/entities/UserStory';
import type { IUserStoryRepository } from '../../../domain/repositories/IUserStoryRepository';
import type { Priority } from '../../../domain/value-objects/Priority';
import type { StoryStatus } from '../../../domain/value-objects/StoryStatus';

export interface CreateStoryInput {
  sprintId: string;
  title: string;
  jiraUrl?: string;
  priority: Priority;
  points: number;
  startDate?: string;
  commitmentDate: string;
  assignees: string[];
}

export class CreateStoryUseCase {
  constructor(private readonly storyRepository: IUserStoryRepository) {}

  async execute(input: CreateStoryInput): Promise<UserStory> {
    if (!input.title.trim()) throw new Error('Story title is required');
    if (!input.sprintId) throw new Error('Sprint is required');
    if (input.points < 0) throw new Error('Points must be non-negative');
    if (!input.commitmentDate) throw new Error('Commitment date is required');

    const now = new Date().toISOString();
    const story: UserStory = {
      id: uuidv4(),
      sprintId: input.sprintId,
      title: input.title.trim(),
      jiraUrl: input.jiraUrl?.trim() || undefined,
      priority: input.priority,
      points: input.points,
      startDate: input.startDate || undefined,
      commitmentDate: input.commitmentDate,
      status: 'open' as StoryStatus,
      progress: 0,
      assignees: input.assignees,
      isBlocked: false,
      blockReason: undefined,
      createdAt: now,
      updatedAt: now,
    };

    await this.storyRepository.save(story);
    return story;
  }
}
