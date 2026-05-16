import { v4 as uuidv4 } from 'uuid';
import type { Sprint } from '@/domain/entities/Sprint';
import type { ISprintRepository } from '@/domain/repositories/ISprintRepository';

export interface CreateSprintInput {
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  committedPoints: number;
}

export class CreateSprintUseCase {
  constructor(private readonly sprintRepository: ISprintRepository) {}

  async execute(input: CreateSprintInput): Promise<Sprint> {
    if (!input.name.trim()) throw new Error('Sprint name is required');
    if (!input.goal.trim()) throw new Error('Sprint goal is required');
    if (!input.startDate) throw new Error('Start date is required');
    if (!input.endDate) throw new Error('End date is required');
    if (new Date(input.startDate) >= new Date(input.endDate)) {
      throw new Error('Start date must be before end date');
    }
    if (input.committedPoints < 0) throw new Error('Committed points must be non-negative');

    const now = new Date().toISOString();
    const sprint: Sprint = {
      id: uuidv4(),
      name: input.name.trim(),
      goal: input.goal.trim(),
      startDate: input.startDate,
      endDate: input.endDate,
      committedPoints: input.committedPoints,
      status: 'planned',
      createdAt: now,
      updatedAt: now,
    };

    await this.sprintRepository.save(sprint);
    return sprint;
  }
}
