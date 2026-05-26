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

    const startDate = input.startDate ?? existing.startDate;
    const endDate = input.endDate ?? existing.endDate;

    let status: Sprint['status'];
    if (input.status !== undefined) {
      status = input.status;
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start <= today && today <= end) status = 'active';
      else if (end < today) status = 'completed';
      else status = 'planned';
    }

    const updated: Sprint = {
      ...existing,
      name: input.name?.trim() ?? existing.name,
      goal: input.goal?.trim() ?? existing.goal,
      startDate,
      endDate,
      committedPoints: input.committedPoints ?? existing.committedPoints,
      status,
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
