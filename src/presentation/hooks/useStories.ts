import { useAppStore } from '../store/useAppStore';
import { useMemo } from 'react';
import type { StoryStatus } from '@/domain/value-objects/StoryStatus';
import { STORY_STATUS_ORDER } from '@/domain/value-objects/StoryStatus';

export function useStories(sprintId?: string) {
  const { stories, progressRecords, createStory, updateStory, deleteStory, addProgress } =
    useAppStore();

  const filteredStories = useMemo(
    () => (sprintId ? stories.filter((s) => s.sprintId === sprintId) : stories),
    [stories, sprintId]
  );

  const storiesByStatus = useMemo(() => {
    const result: Record<StoryStatus, typeof filteredStories> = {
      'open': [],
      'blocked': [],
      'in-development': [],
      'done-development': [],
      'in-certification': [],
      'done-certification': [],
      'pase-management': [],
      'finalized': [],
      'done-prd': [],
    };
    for (const story of filteredStories) {
      result[story.status].push(story);
    }
    return result;
  }, [filteredStories]);

  const blockedStories = useMemo(
    () => filteredStories.filter((s) => s.isBlocked),
    [filteredStories]
  );

  const getStoryProgress = (storyId: string) => {
    return progressRecords
      .filter((p) => p.storyId === storyId)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  };

  const getStoriesByStatus = (status: StoryStatus) => {
    return filteredStories.filter((s) => s.status === status);
  };

  const statusColumns = useMemo(() => {
    return STORY_STATUS_ORDER.map((status) => ({
      status,
      stories: storiesByStatus[status],
    }));
  }, [storiesByStatus]);

  return {
    stories: filteredStories,
    storiesByStatus,
    blockedStories,
    statusColumns,
    createStory,
    updateStory,
    deleteStory,
    addProgress,
    getStoryProgress,
    getStoriesByStatus,
  };
}
