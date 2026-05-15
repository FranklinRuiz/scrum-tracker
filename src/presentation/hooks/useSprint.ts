import { useAppStore } from '../store/useAppStore';
import { useMemo } from 'react';
import type { Sprint } from '../../domain/entities/Sprint';

const HOURS_PER_POINT = 8;

export function useSprint() {
  const {
    sprints,
    selectedSprintId,
    setSelectedSprint,
    createSprint,
    updateSprint,
    deleteSprint,
    stories,
    progressRecords,
  } = useAppStore();

  const selectedSprint = useMemo(
    () => sprints.find((s) => s.id === selectedSprintId) ?? null,
    [sprints, selectedSprintId]
  );

  const activeSprint = useMemo(
    () => sprints.find((s) => s.status === 'active') ?? null,
    [sprints]
  );

  const sprintsByStatus = useMemo(() => {
    const result: Record<Sprint['status'], Sprint[]> = {
      planned: [],
      active: [],
      completed: [],
    };
    for (const sprint of sprints) {
      result[sprint.status].push(sprint);
    }
    return result;
  }, [sprints]);

  const getSprintProgress = (sprintId: string) => {
    const sprintStories = stories.filter((s) => s.sprintId === sprintId);
    if (sprintStories.length === 0) return 0;

    const storyIds = new Set(sprintStories.map((s) => s.id));
    const totalHours = progressRecords
      .filter((p) => storyIds.has(p.storyId))
      .reduce((sum, p) => sum + p.hoursWorked, 0);
    const totalCapacity = sprintStories.reduce((sum, s) => sum + s.points * HOURS_PER_POINT, 0);

    return totalCapacity > 0 ? Math.round((totalHours / totalCapacity) * 100) : 0;
  };

  return {
    sprints,
    selectedSprint,
    activeSprint,
    sprintsByStatus,
    selectedSprintId,
    setSelectedSprint,
    createSprint,
    updateSprint,
    deleteSprint,
    getSprintProgress,
  };
}
