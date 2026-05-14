import { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { AlertService } from '../../application/services/AlertService';
import type { Alert } from '../../application/services/AlertService';

export function useAlerts() {
  const { sprints, stories, progressRecords } = useAppStore();

  const alerts = useMemo((): Alert[] => {
    const activeSprint = sprints.find((s) => s.status === 'active');
    if (!activeSprint) return [];

    const activeStories = stories.filter((s) => s.sprintId === activeSprint.id);
    return AlertService.generateAlerts(activeSprint, activeStories, progressRecords);
  }, [sprints, stories, progressRecords]);

  const criticalAlerts = useMemo(
    () => alerts.filter((a) => a.severity === 'critical'),
    [alerts]
  );

  const warningAlerts = useMemo(
    () => alerts.filter((a) => a.severity === 'warning'),
    [alerts]
  );

  const infoAlerts = useMemo(
    () => alerts.filter((a) => a.severity === 'info'),
    [alerts]
  );

  return {
    alerts,
    criticalAlerts,
    warningAlerts,
    infoAlerts,
    totalCount: alerts.length,
    criticalCount: criticalAlerts.length,
  };
}
