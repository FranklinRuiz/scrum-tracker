import type { StoryStatus } from '../value-objects/StoryStatus';

export interface ProgressRecord {
  id: string;
  storyId: string;
  developerId: string;
  timestamp: string; // ISO datetime
  hoursWorked: number;
  comment: string;
  progressPercentage: number;
  newStatus: StoryStatus;
  commitmentMet?: boolean;
}
