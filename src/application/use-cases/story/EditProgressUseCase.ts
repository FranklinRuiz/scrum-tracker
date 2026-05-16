import type { ProgressRecord } from '@/domain/entities/ProgressRecord';
import type { IProgressRepository } from '@/domain/repositories/IProgressRepository';
import type { IUserStoryRepository } from '@/domain/repositories/IUserStoryRepository';
import type { StoryStatus } from '@/domain/value-objects/StoryStatus';

const HOURS_PER_POINT = 8;

export interface EditProgressInput {
  recordId: string;
  storyId: string;
  developerId: string;
  hoursWorked: number;
  comment: string;
  newStatus: StoryStatus;
  commitmentMet?: boolean;
}

function recalculate(
  allRecords: ProgressRecord[],
  points: number
): { progress: number; latestStatus: StoryStatus } {
  const totalHours = allRecords.reduce((sum, r) => sum + r.hoursWorked, 0);
  const capacity = points * HOURS_PER_POINT;
  const progress = capacity > 0 ? Math.round((totalHours / capacity) * 100) : 0;
  const sorted = [...allRecords].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const latestStatus = sorted[0]?.newStatus ?? 'open';
  return { progress, latestStatus };
}

export class EditProgressUseCase {
  constructor(
    private readonly progressRepository: IProgressRepository,
    private readonly storyRepository: IUserStoryRepository
  ) {}

  async execute(input: EditProgressInput): Promise<ProgressRecord> {
    const story = await this.storyRepository.getById(input.storyId);
    if (!story) throw new Error(`UserStory not found: ${input.storyId}`);
    if (input.hoursWorked < 0) throw new Error('Hours worked must be non-negative');

    const allRecords = await this.progressRepository.getByStoryId(input.storyId);
    const updatedRecord: ProgressRecord = {
      ...allRecords.find((r) => r.id === input.recordId)!,
      developerId: input.developerId,
      hoursWorked: input.hoursWorked,
      comment: input.comment.trim(),
      newStatus: input.newStatus,
      commitmentMet: input.commitmentMet ?? false,
    };

    const updatedAll = allRecords.map((r) => (r.id === input.recordId ? updatedRecord : r));
    const { progress, latestStatus } = recalculate(updatedAll, story.points);

    updatedRecord.progressPercentage = progress;
    await this.progressRepository.update(updatedRecord);

    await this.storyRepository.update({
      ...story,
      progress,
      status: latestStatus,
      updatedAt: new Date().toISOString(),
    });

    return updatedRecord;
  }
}

export class DeleteProgressUseCase {
  constructor(
    private readonly progressRepository: IProgressRepository,
    private readonly storyRepository: IUserStoryRepository
  ) {}

  async execute(recordId: string, storyId: string): Promise<void> {
    const story = await this.storyRepository.getById(storyId);
    if (!story) throw new Error(`UserStory not found: ${storyId}`);

    await this.progressRepository.delete(recordId);

    const remaining = await this.progressRepository.getByStoryId(storyId);
    const { progress, latestStatus } = recalculate(remaining, story.points);

    await this.storyRepository.update({
      ...story,
      progress,
      status: remaining.length === 0 ? 'open' : latestStatus,
      updatedAt: new Date().toISOString(),
    });
  }
}
