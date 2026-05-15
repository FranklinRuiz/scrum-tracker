import { v4 as uuidv4 } from 'uuid';
import type { ProgressRecord } from '../../../domain/entities/ProgressRecord';
import type { IProgressRepository } from '../../../domain/repositories/IProgressRepository';
import type { IUserStoryRepository } from '../../../domain/repositories/IUserStoryRepository';
import type { StoryStatus } from '../../../domain/value-objects/StoryStatus';

const HOURS_PER_POINT = 8;

export interface AddProgressInput {
  storyId: string;
  developerId: string;
  hoursWorked: number;
  comment: string;
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

    const existingRecords = await this.progressRepository.getByStoryId(input.storyId);
    const totalHours = existingRecords.reduce((sum, r) => sum + r.hoursWorked, 0) + input.hoursWorked;
    const capacity = story.points * HOURS_PER_POINT;
    const computedProgress = capacity > 0
      ? Math.round((totalHours / capacity) * 100)
      : 0;

    const now = new Date().toISOString();
    const record: ProgressRecord = {
      id: uuidv4(),
      storyId: input.storyId,
      developerId: input.developerId,
      timestamp: now,
      hoursWorked: input.hoursWorked,
      comment: input.comment.trim(),
      progressPercentage: computedProgress,
      newStatus: input.newStatus,
      commitmentMet: input.commitmentMet ?? false,
    };

    await this.progressRepository.save(record);

    const updatedStory = {
      ...story,
      status: input.newStatus,
      progress: computedProgress,
      updatedAt: now,
    };
    await this.storyRepository.update(updatedStory);

    return record;
  }
}
