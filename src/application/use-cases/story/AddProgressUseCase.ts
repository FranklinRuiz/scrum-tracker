import { v4 as uuidv4 } from 'uuid';
import type { ProgressRecord } from '../../../domain/entities/ProgressRecord';
import type { IProgressRepository } from '../../../domain/repositories/IProgressRepository';
import type { IUserStoryRepository } from '../../../domain/repositories/IUserStoryRepository';
import type { StoryStatus } from '../../../domain/value-objects/StoryStatus';

export interface AddProgressInput {
  storyId: string;
  developerId: string;
  hoursWorked: number;
  comment: string;
  progressPercentage: number;
  newStatus: StoryStatus;
  commitmentMet?: boolean;
}

export class AddProgressUseCase {
  constructor(
    private readonly progressRepository: IProgressRepository,
    private readonly storyRepository: IUserStoryRepository
  ) {}

  async execute(input: AddProgressInput): Promise<ProgressRecord> {
    const story = await this.storyRepository.getById(input.storyId);
    if (!story) throw new Error(`UserStory not found: ${input.storyId}`);
    if (!input.developerId) throw new Error('Developer is required');
    if (input.hoursWorked < 0) throw new Error('Hours worked must be non-negative');
    if (input.progressPercentage < 0 || input.progressPercentage > 100) {
      throw new Error('Progress percentage must be between 0 and 100');
    }

    const now = new Date().toISOString();
    const record: ProgressRecord = {
      id: uuidv4(),
      storyId: input.storyId,
      developerId: input.developerId,
      timestamp: now,
      hoursWorked: input.hoursWorked,
      comment: input.comment.trim(),
      progressPercentage: input.progressPercentage,
      newStatus: input.newStatus,
      commitmentMet: input.commitmentMet ?? false,
    };

    await this.progressRepository.save(record);

    // Update the story status and progress
    const updatedStory = {
      ...story,
      status: input.newStatus,
      progress: input.progressPercentage,
      updatedAt: now,
    };
    await this.storyRepository.update(updatedStory);

    return record;
  }
}
