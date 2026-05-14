import type { UserStory } from '../../../domain/entities/UserStory';
import type { IUserStoryRepository } from '../../../domain/repositories/IUserStoryRepository';
import type { Priority } from '../../../domain/value-objects/Priority';
import type { StoryStatus } from '../../../domain/value-objects/StoryStatus';

export interface UpdateStoryInput {
  id: string;
  title?: string;
  jiraUrl?: string;
  priority?: Priority;
  points?: number;
  commitmentDate?: string;
  status?: StoryStatus;
  progress?: number;
  assignees?: string[];
  isBlocked?: boolean;
  blockReason?: string;
  sprintId?: string;
}

export class UpdateStoryUseCase {
  constructor(private readonly storyRepository: IUserStoryRepository) {}

  async execute(input: UpdateStoryInput): Promise<UserStory> {
    const existing = await this.storyRepository.getById(input.id);
    if (!existing) throw new Error(`UserStory not found: ${input.id}`);

    if (input.title !== undefined && !input.title.trim()) {
      throw new Error('Story title cannot be empty');
    }
    if (input.points !== undefined && input.points < 0) {
      throw new Error('Points must be non-negative');
    }
    if (input.progress !== undefined && (input.progress < 0 || input.progress > 100)) {
      throw new Error('Progress must be between 0 and 100');
    }

    const updated: UserStory = {
      ...existing,
      title: input.title?.trim() ?? existing.title,
      jiraUrl: input.jiraUrl !== undefined ? (input.jiraUrl.trim() || undefined) : existing.jiraUrl,
      priority: input.priority ?? existing.priority,
      points: input.points ?? existing.points,
      commitmentDate: input.commitmentDate ?? existing.commitmentDate,
      status: input.status ?? existing.status,
      progress: input.progress ?? existing.progress,
      assignees: input.assignees ?? existing.assignees,
      isBlocked: input.isBlocked ?? existing.isBlocked,
      blockReason: input.isBlocked ? (input.blockReason ?? existing.blockReason) : undefined,
      sprintId: input.sprintId ?? existing.sprintId,
      updatedAt: new Date().toISOString(),
    };

    await this.storyRepository.update(updated);
    return updated;
  }
}
