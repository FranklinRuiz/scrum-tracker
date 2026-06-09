import React, { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useAlerts } from '../hooks/useAlerts';
import { GetSprintMetricsUseCase } from '@/application/use-cases/sprint/GetSprintMetricsUseCase.ts';
import { LocalStorageSprintRepository } from '@/infrastructure/repositories/LocalStorageSprintRepository.ts';
import { LocalStorageUserStoryRepository } from '@/infrastructure/repositories/LocalStorageUserStoryRepository';
import { LocalStorageProgressRepository } from '@/infrastructure/repositories/LocalStorageProgressRepository';
import { StatsCards } from '../components/dashboard/StatsCards';
import { BurndownChart } from '../components/dashboard/BurndownChart';
import { VelocityChart } from '../components/dashboard/VelocityChart';
import { SprintProgress } from '../components/dashboard/SprintProgress';
import { DeveloperMetrics } from '../components/dashboard/DeveloperMetrics';
import { AlertsPanel } from '../components/dashboard/AlertsPanel';
import { HoursPerDayChart } from '../components/dashboard/HoursPerDayChart';
import { EmptyState } from '../components/common/EmptyState';
import { LayoutDashboard } from 'lucide-react';
import type { BurndownDataPoint } from '@/application/use-cases/sprint/GetSprintMetricsUseCase';
import type { VelocityDataPoint } from '@/application/use-cases/dashboard/GetDashboardDataUseCase';
import { isTerminalStatus } from '@/domain/value-objects/StoryStatus';
import { getEffectiveDays, getDevCapacity, getWorkingDays } from '@/domain/entities/Sprint';

export const DashboardPage: React.FC = () => {
  const { sprints, stories, progressRecords, developers, holidays, availability } = useAppStore();
  const { alerts } = useAlerts();

  const activeSprint = useMemo(
    () => sprints.find((s) => s.status === 'active') ?? null,
    [sprints]
  );

  const activeSprintStories = useMemo(
    () => (activeSprint ? stories.filter((s) => s.sprintId === activeSprint.id) : []),
    [stories, activeSprint]
  );


  const commitmentMetIds = useMemo(
    () => new Set(progressRecords.filter((p) => p.commitmentMet).map((p) => p.storyId)),
    [progressRecords]
  );

  const blockedCount = useMemo(
    () => activeSprintStories.filter((s) => s.isBlocked).length,
    [activeSprintStories]
  );

  const today = new Date();
  const atRiskCount = useMemo(() => {
    if (!activeSprint) return 0;
    const start = new Date(activeSprint.startDate);
    const end = new Date(activeSprint.endDate);
    const totalDays = Math.max(1, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const elapsed = Math.min(totalDays, Math.max(0, (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const workingDays = getWorkingDays(activeSprint.startDate, activeSprint.endDate);
    const expected = Math.min(100, (elapsed / Math.max(1, workingDays)) * 100);
    return activeSprintStories.filter(
      (s) =>
        !s.isBlocked &&
        !isTerminalStatus(s.status) &&
        !commitmentMetIds.has(s.id) &&
        s.progress < expected - 15
    ).length;
  }, [activeSprintStories, activeSprint, commitmentMetIds]);

  // Velocidad del equipo: HUs con compromiso cumplido en el sprint activo
  const teamVelocity = useMemo(() => {
    if (!activeSprint) return 0;
    return activeSprintStories.filter((s) => commitmentMetIds.has(s.id)).length;
  }, [activeSprint, activeSprintStories, commitmentMetIds]);

  // Velocity chart — histórico por sprint (completados + activo)
  const velocityData: VelocityDataPoint[] = useMemo(() => {
    return sprints
      .filter((s) => s.status === 'completed' || s.status === 'active')
      .map((sprint) => {
        const sprintStories = stories.filter((s) => s.sprintId === sprint.id);
        const committed = sprintStories.length;
        const completed = sprintStories.filter((s) => commitmentMetIds.has(s.id)).length;
        return { sprint: sprint.name, committed, completed };
      });
  }, [sprints, stories, commitmentMetIds]);

  // Burndown data
  const [burndownData, setBurndownData] = React.useState<BurndownDataPoint[]>([]);

  React.useEffect(() => {
    if (!activeSprint) {
      setBurndownData([]);
      return;
    }
    const sprintRepo = new LocalStorageSprintRepository();
    const storyRepo = new LocalStorageUserStoryRepository();
    const progressRepo = new LocalStorageProgressRepository();
    const useCase = new GetSprintMetricsUseCase(sprintRepo, storyRepo, progressRepo);
    useCase.execute(activeSprint.id).then((metrics) => {
      setBurndownData(metrics.burndownData);
    });
  }, [activeSprint, stories, progressRecords]);

  // Progress records del sprint activo (para gráfico de horas por día)
  const activeSprintProgressRecords = useMemo(() => {
    if (!activeSprint) return [];
    const storyIds = new Set(activeSprintStories.map((s) => s.id));
    return progressRecords.filter((p) => storyIds.has(p.storyId));
  }, [progressRecords, activeSprint, activeSprintStories]);

  // Developer metrics
  const developerMetrics = useMemo(() => {
    if (!activeSprint) return [];
    const sprintStoryIds = new Set(activeSprintStories.map((s) => s.id));
    const sprintHolidayCount = holidays.filter((h) => h.sprintId === activeSprint.id).length;
    const effectiveDays = getEffectiveDays(activeSprint.startDate, activeSprint.endDate, sprintHolidayCount);

    return developers.map((dev) => {
      const devProgress = progressRecords.filter(
        (p) => p.developerId === dev.id && sprintStoryIds.has(p.storyId)
      );
      const earnedHours = devProgress.reduce((sum, p) => sum + p.hoursWorked, 0);
      const earnedPoints = Math.round((earnedHours / 8) * 10) / 10;
      const storiesWorked = new Set(devProgress.map((p) => p.storyId)).size;

      const devAvail = availability.find(
        (a) => a.sprintId === activeSprint.id && a.developerId === dev.id
      );
      const availablePoints = getDevCapacity(effectiveDays, devAvail?.daysOff ?? 0);
      const percentage = availablePoints > 0
        ? Math.min(100, Math.round((earnedPoints / availablePoints) * 100))
        : 0;

      return { developer: dev, earnedHours, earnedPoints, availablePoints, percentage, storiesWorked };
    });
  }, [developers, progressRecords, activeSprint, activeSprintStories, holidays, availability]);

  if (!activeSprint) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<LayoutDashboard className="h-16 w-16" />}
          title="No Active Sprint"
          description="Create and activate a sprint to see dashboard metrics."
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Stats cards */}
      <StatsCards
        blockedCount={blockedCount}
        atRiskCount={atRiskCount}
        teamVelocity={teamVelocity}
      />

      {/* Sprint progress + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SprintProgress sprint={activeSprint} stories={activeSprintStories} progressRecords={progressRecords} />
        </div>
        <AlertsPanel alerts={alerts} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BurndownChart data={burndownData} />
        <VelocityChart data={velocityData} />
      </div>

      {/* Hours per day time series */}
      <HoursPerDayChart
        progressRecords={activeSprintProgressRecords}
        developers={developers}
        sprintStartDate={activeSprint.startDate}
        sprintEndDate={activeSprint.endDate}
      />

      {/* Developer Metrics */}
      <DeveloperMetrics metrics={developerMetrics} />
    </div>
  );
};
