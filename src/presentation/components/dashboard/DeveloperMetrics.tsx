import React from 'react';
import { BookOpen, Target } from 'lucide-react';
import type { DeveloperMetric } from '@/application/use-cases/dashboard/GetDashboardDataUseCase';
import { Card } from '../common/Card';
import { Avatar } from '../common/Avatar';
import { ProgressBar } from '../common/ProgressBar';

interface DeveloperMetricsProps {
  metrics: DeveloperMetric[];
}

export const DeveloperMetrics: React.FC<DeveloperMetricsProps> = ({ metrics }) => {
  if (metrics.length === 0) {
    return (
      <Card>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
          Métricas del equipo
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          Sin datos de desarrolladores
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
        Métricas del equipo
      </h3>
      <div className="space-y-4">
        {metrics.map(({ developer, earnedPoints, availablePoints, percentage, storiesWorked }) => (
          <div key={developer.id} className="flex items-center gap-4">
            <Avatar developer={developer} size="md" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {developer.name}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{developer.role}</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 shrink-0">
                  <div className="flex items-center gap-1">
                    <Target className="h-3.5 w-3.5" />
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {earnedPoints} / {availablePoints} pts
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>{storiesWorked}</span>
                  </div>
                </div>
              </div>
              <ProgressBar value={percentage} size="sm" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
