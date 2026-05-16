import type { Sprint, SprintStatus } from '@/domain/entities/Sprint';
import type { ISprintRepository } from '@/domain/repositories/ISprintRepository';

export interface UpdateSprintInput {
  id: string;
  name?: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
  committedPoints?: number;
  status?: SprintStatus;
}

export class UpdateSprintUseCase {
  constructor(private readonly sprintRepository: ISprintRepository) {}

  async execute(input: UpdateSprintInput): Promise<Sprint> {
    const existing = await this.sprintRepository.getById(input.id);
    if (!existing) throw new Error(`Sprint not found: ${input.id}`);

    const updated: Sprint = {
      ...existing,
      name: input.name?.trim() ?? existing.name,
      goal: input.goal?.trim() ?? existing.goal,
      startDate: input.startDate ?? existing.startDate,
      endDate: input.endDate ?? existing.endDate,
      committedPoints: input.committedPoints ?? existing.committedPoints,
      status: input.status ?? existing.status,
      updatedAt: new Date().toISOString(),
    };

    if (updated.name === '') throw new Error('Sprint name cannot be empty');
    if (new Date(updated.startDate) >= new Date(updated.endDate)) {
      throw new Error('Start date must be before end date');
    }

    await this.sprintRepository.update(updated);
    return updated;
  }
}
