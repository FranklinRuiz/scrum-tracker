import { useAppStore } from '../store/useAppStore';
import { useMemo } from 'react';
import { isTerminalStatus } from '../../domain/value-objects/StoryStatus';
import type { Sprint } from '../../domain/entities/Sprint';

export function useSprint() {
  const {
    sprints,
    selectedSprintId,
    setSelectedSprint,
    createSprint,
    updateSprint,
    deleteSprint,
    stories,
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
    const sprint = sprints.find((s) => s.id === sprintId);
    if (!sprint) return 0;
    const sprintStories = stories.filter((s) => s.sprintId === sprintId);
    const completedPoints = sprintStories
      .filter((s) => isTerminalStatus(s.status))
      .reduce((sum, s) => sum + s.points, 0);
    return sprint.committedPoints > 0
      ? Math.round((completedPoints / sprint.committedPoints) * 100)
      : 0;
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
