import type { UserStory } from '@/domain/entities/UserStory';
import type { ProgressRecord } from '@/domain/entities/ProgressRecord';
import type { Sprint } from '@/domain/entities/Sprint';
import { isTerminalStatus } from '@/domain/value-objects/StoryStatus';

export interface SprintProgress {
  committed: number;
  completed: number;
  percentage: number;
  inProgress: number;
}

export interface DeveloperHours {
  developerId: string;
  totalHours: number;
  recordCount: number;
}

export class MetricsService {
  static calculateSprintProgress(
    sprint: Sprint,
    stories: UserStory[]
  ): SprintProgress {
    const committed = sprint.committedPoints;
    const completed = stories
      .filter((s) => isTerminalStatus(s.status))
      .reduce((sum, s) => sum + s.points, 0);
    const inProgress = stories
      .filter((s) => !isTerminalStatus(s.status) && s.status !== 'open')
      .reduce((sum, s) => sum + s.points, 0);

    return {
      committed,
      completed,
      percentage: committed > 0 ? Math.round((completed / committed) * 100) : 0,
      inProgress,
    };
  }

  static calculateDeveloperHours(progressRecords: ProgressRecord[]): DeveloperHours[] {
    const map = new Map<string, DeveloperHours>();

    for (const record of progressRecords) {
      const existing = map.get(record.developerId);
      if (existing) {
        existing.totalHours += record.hoursWorked;
        existing.recordCount += 1;
      } else {
        map.set(record.developerId, {
          developerId: record.developerId,
          totalHours: record.hoursWorked,
          recordCount: 1,
        });
      }
    }

    return Array.from(map.values());
  }

  static calculateVelocity(sprints: Sprint[], stories: UserStory[]): number {
    const completedSprints = sprints.filter((s) => s.status === 'completed');
    if (completedSprints.length === 0) return 0;

    const totalCompleted = completedSprints.reduce((sum, sprint) => {
      const sprintStories = stories.filter(
        (s) => s.sprintId === sprint.id && isTerminalStatus(s.status)
      );
      return sum + sprintStories.reduce((pts, s) => pts + s.points, 0);
    }, 0);

    return Math.round(totalCompleted / completedSprints.length);
  }
}
