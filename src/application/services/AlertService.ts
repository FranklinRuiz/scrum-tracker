import type { UserStory } from '../../domain/entities/UserStory';
import type { Sprint } from '../../domain/entities/Sprint';
import type { ProgressRecord } from '../../domain/entities/ProgressRecord';
import { differenceInDays, parseISO } from 'date-fns';
import { EFFECTIVE_SPRINT_DAYS } from '../../domain/entities/Sprint';
import { isTerminalStatus } from '../../domain/value-objects/StoryStatus';

export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface Alert {
  id: string;
  storyId?: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  createdAt: string;
}

export class AlertService {
  static generateAlerts(
    sprint: Sprint,
    stories: UserStory[],
    progressRecords: ProgressRecord[]
  ): Alert[] {
    const alerts: Alert[] = [];
    const now = new Date();
    const sprintStart = parseISO(sprint.startDate);
    const daysElapsed = Math.max(0, differenceInDays(now, sprintStart));
    const expectedProgress = Math.min(100, (daysElapsed / EFFECTIVE_SPRINT_DAYS) * 100);

    for (const story of stories) {
      // Regla 1: HU bloqueada
      if (story.isBlocked) {
        alerts.push({
          id: `blocked-${story.id}`,
          storyId: story.id,
          title: 'Historia bloqueada',
          message: `"${story.title}" está bloqueada${story.blockReason ? ': ' + story.blockReason : ''}`,
          severity: 'critical',
          createdAt: now.toISOString(),
        });
      }

      // Regla 2: Avance menor al esperado
      if (
        !story.isBlocked &&
        !isTerminalStatus(story.status) &&
        story.progress < expectedProgress - 10 &&
        daysElapsed > 1
      ) {
        alerts.push({
          id: `behind-${story.id}`,
          storyId: story.id,
          title: 'Historia retrasada',
          message: `"${story.title}" lleva ${story.progress}% pero se esperaba ${Math.round(expectedProgress)}% a esta altura`,
          severity: 'warning',
          createdAt: now.toISOString(),
        });
      }

      // Regla 3: Fecha compromiso vencida y no completada
      if (
        story.commitmentDate &&
        !isTerminalStatus(story.status) &&
        new Date(story.commitmentDate) < now
      ) {
        alerts.push({
          id: `overdue-${story.id}`,
          storyId: story.id,
          title: 'Fecha compromiso vencida',
          message: `"${story.title}" venció su fecha compromiso y no está completada`,
          severity: 'critical',
          createdAt: now.toISOString(),
        });
      }

      // Regla 5: Sin actualización por más de 2 días
      const storyProgress = progressRecords.filter((p) => p.storyId === story.id);
      if (storyProgress.length > 0 && !isTerminalStatus(story.status)) {
        const lastUpdate = storyProgress
          .map((p) => parseISO(p.timestamp))
          .sort((a, b) => b.getTime() - a.getTime())[0];
        const daysSinceUpdate = differenceInDays(now, lastUpdate);
        if (daysSinceUpdate > 2) {
          alerts.push({
            id: `stale-${story.id}`,
            storyId: story.id,
            title: 'Sin actualización',
            message: `"${story.title}" no ha sido actualizada en ${daysSinceUpdate} días`,
            severity: 'info',
            createdAt: now.toISOString(),
          });
        }
      }
    }

    // Regla 4: Puntos comprometidos excedidos
    const totalAssignedPoints = stories.reduce((sum, s) => sum + s.points, 0);
    if (totalAssignedPoints > sprint.committedPoints) {
      alerts.push({
        id: `overcommit-${sprint.id}`,
        title: 'Sprint sobrecomprometido',
        message: `El sprint tiene ${totalAssignedPoints} puntos asignados pero solo se comprometieron ${sprint.committedPoints}`,
        severity: 'warning',
        createdAt: now.toISOString(),
      });
    }

    return alerts;
  }
}
