import type { ISprintRepository } from '@/domain/repositories/ISprintRepository';
import type { IUserStoryRepository } from '@/domain/repositories/IUserStoryRepository';
import type { IProgressRepository } from '@/domain/repositories/IProgressRepository';
import { differenceInDays, parseISO, format, eachDayOfInterval } from 'date-fns';
import { EFFECTIVE_SPRINT_DAYS } from '@/domain/entities/Sprint';
import { isTerminalStatus } from '@/domain/value-objects/StoryStatus';

export interface BurndownDataPoint {
  day: string;
  ideal: number;
  actual: number;
}

export interface SprintMetrics {
  totalPoints: number;
  completedPoints: number;
  remainingPoints: number;
  progressPercentage: number;
  daysElapsed: number;
  daysTotal: number;
  daysRemaining: number;
  burndownData: BurndownDataPoint[];
  blockedCount: number;
  atRiskCount: number;
}

export class GetSprintMetricsUseCase {
  constructor(
    private readonly sprintRepository: ISprintRepository,
    private readonly storyRepository: IUserStoryRepository,
    private readonly progressRepository: IProgressRepository
  ) {}

  async execute(sprintId: string): Promise<SprintMetrics> {
    const sprint = await this.sprintRepository.getById(sprintId);
    if (!sprint) throw new Error(`Sprint not found: ${sprintId}`);

    const stories = await this.storyRepository.getBySprintId(sprintId);
    const allProgress = await this.progressRepository.getAll();
    const sprintProgress = allProgress.filter((p) =>
      stories.some((s) => s.id === p.storyId)
    );

    const totalPoints = sprint.committedPoints;
    const completedPoints = stories
      .filter((s) => isTerminalStatus(s.status))
      .reduce((sum, s) => sum + s.points, 0);
    const remainingPoints = Math.max(0, totalPoints - completedPoints);

    const start = parseISO(sprint.startDate);
    const end = parseISO(sprint.endDate);
    const today = new Date();
    const daysTotal = differenceInDays(end, start);
    const daysElapsed = Math.min(
      Math.max(0, differenceInDays(today, start)),
      daysTotal
    );
    const daysRemaining = Math.max(0, daysTotal - daysElapsed);

    // Build burndown data
    const days = eachDayOfInterval({ start, end });
    const burndownData: BurndownDataPoint[] = days.map((day, index) => {
      const effectiveDay = index;
      const idealRemaining = Math.max(
        0,
        totalPoints - (totalPoints / EFFECTIVE_SPRINT_DAYS) * effectiveDay
      );

      // Calculate actual completed points up to this day
      const dayStr = format(day, 'yyyy-MM-dd');
      const completedByDay = stories
        .filter((story) => {
          const latestProgress = sprintProgress
            .filter((p) => p.storyId === story.id && p.timestamp.startsWith(dayStr))
            .sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];
          if (latestProgress) return isTerminalStatus(latestProgress.newStatus);

          const allStoryProgress = sprintProgress
            .filter((p) => p.storyId === story.id && p.timestamp <= dayStr + 'T23:59:59')
            .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

          if (allStoryProgress[0]) {
            return isTerminalStatus(allStoryProgress[0].newStatus);
          }
          return false;
        })
        .reduce((sum, s) => sum + s.points, 0);

      const actualRemaining = Math.max(0, totalPoints - completedByDay);
      const isPast = day <= today;

      return {
        day: format(day, 'MMM d'),
        ideal: Math.round(idealRemaining),
        actual: isPast ? Math.round(actualRemaining) : -1,
      };
    });

    const blockedCount = stories.filter((s) => s.isBlocked).length;
    const expectedProgress = (daysElapsed / EFFECTIVE_SPRINT_DAYS) * 100;
    const atRiskCount = stories.filter(
      (s) =>
        !s.isBlocked &&
        !isTerminalStatus(s.status) &&
        s.progress < expectedProgress - 10
    ).length;

    return {
      totalPoints,
      completedPoints,
      remainingPoints,
      progressPercentage:
        totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0,
      daysElapsed,
      daysTotal,
      daysRemaining,
      burndownData,
      blockedCount,
      atRiskCount,
    };
  }
}
