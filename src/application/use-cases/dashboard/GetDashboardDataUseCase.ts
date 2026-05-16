import type { ISprintRepository } from '@/domain/repositories/ISprintRepository';
import type { IUserStoryRepository } from '@/domain/repositories/IUserStoryRepository';
import type { IProgressRepository } from '@/domain/repositories/IProgressRepository';
import type { IDeveloperRepository } from '@/domain/repositories/IDeveloperRepository';
import type { Sprint } from '@/domain/entities/Sprint';
import type { UserStory } from '@/domain/entities/UserStory';
import type { ProgressRecord } from '@/domain/entities/ProgressRecord';
import type { Developer } from '@/domain/entities/Developer';
import { isTerminalStatus } from '@/domain/value-objects/StoryStatus';

export interface DeveloperMetric {
  developer: Developer;
  earnedHours: number;
  earnedPoints: number;
  availablePoints: number;
  percentage: number;
  storiesWorked: number;
}

export interface VelocityDataPoint {
  sprint: string;
  committed: number;
  completed: number;
}

export interface DashboardData {
  activeSprint: Sprint | null;
  sprints: Sprint[];
  activeSprintStories: UserStory[];
  allStories: UserStory[];
  progressRecords: ProgressRecord[];
  developers: Developer[];
  developerMetrics: DeveloperMetric[];
  velocityData: VelocityDataPoint[];
  totalBlockedStories: number;
  atRiskStories: number;
  teamVelocity: number;
}

export class GetDashboardDataUseCase {
  constructor(
    private readonly sprintRepository: ISprintRepository,
    private readonly storyRepository: IUserStoryRepository,
    private readonly progressRepository: IProgressRepository,
    private readonly developerRepository: IDeveloperRepository
  ) {}

  async execute(): Promise<DashboardData> {
    const [sprints, allStories, progressRecords, developers] = await Promise.all([
      this.sprintRepository.getAll(),
      this.storyRepository.getAll(),
      this.progressRepository.getAll(),
      this.developerRepository.getAll(),
    ]);

    const activeSprint = sprints.find((s) => s.status === 'active') ?? null;
    const activeSprintStories = activeSprint
      ? allStories.filter((s) => s.sprintId === activeSprint.id)
      : [];

    // Developer metrics (sprint-scoped; availability data not wired here — use DashboardPage for full calc)
    const sprintStoryIds = new Set(activeSprintStories.map((s) => s.id));
    const developerMetrics: DeveloperMetric[] = developers.map((dev) => {
      const devProgress = progressRecords.filter(
        (p) => p.developerId === dev.id && sprintStoryIds.has(p.storyId)
      );
      const earnedHours = devProgress.reduce((sum, p) => sum + p.hoursWorked, 0);
      const earnedPoints = Math.round((earnedHours / 8) * 10) / 10;
      const storiesWorked = new Set(devProgress.map((p) => p.storyId)).size;
      return { developer: dev, earnedHours, earnedPoints, availablePoints: 0, percentage: 0, storiesWorked };
    });

    // Velocity data
    const completedSprints = sprints.filter((s) => s.status === 'completed' || s.status === 'active');
    const velocityData: VelocityDataPoint[] = completedSprints.map((sprint) => {
      const sprintStories = allStories.filter((s) => s.sprintId === sprint.id);
      const completed = sprintStories
        .filter((s) => isTerminalStatus(s.status))
        .reduce((sum, s) => sum + s.points, 0);
      return {
        sprint: sprint.name,
        committed: sprint.committedPoints,
        completed,
      };
    });

    const teamVelocity =
      completedSprints.length > 0
        ? Math.round(
            velocityData.reduce((sum, v) => sum + v.completed, 0) /
              completedSprints.length
          )
        : 0;

    const totalBlockedStories = allStories.filter((s) => s.isBlocked).length;

    // At-risk: stories with progress significantly behind expected
    const today = new Date();
    const atRiskStories = activeSprintStories.filter((story) => {
      if (isTerminalStatus(story.status) || story.isBlocked) return false;
      const sprint = activeSprint;
      if (!sprint) return false;
      const start = new Date(sprint.startDate);
      const end = new Date(sprint.endDate);
      const totalDays = Math.max(1, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const elapsed = Math.min(
        totalDays,
        Math.max(0, (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      );
      const expectedProgress = (elapsed / 8) * 100;
      return story.progress < expectedProgress - 15;
    }).length;

    return {
      activeSprint,
      sprints,
      activeSprintStories,
      allStories,
      progressRecords,
      developers,
      developerMetrics,
      velocityData,
      totalBlockedStories,
      atRiskStories,
      teamVelocity,
    };
  }
}
