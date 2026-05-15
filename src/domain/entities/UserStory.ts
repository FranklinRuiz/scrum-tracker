import type { StoryStatus } from '../value-objects/StoryStatus';
import type { Priority } from '../value-objects/Priority';

export interface UserStory {
  id: string;
  sprintId: string;
  title: string;
  jiraUrl?: string;
  priority: Priority;
  points: number;
  startDate?: string; // ISO date
  commitmentDate: string; // ISO date
  status: StoryStatus;
  progress: number; // 0-100
  assignees: string[]; // developer IDs
  isBlocked: boolean;
  blockReason?: string;
  createdAt: string;
  updatedAt: string;
}
