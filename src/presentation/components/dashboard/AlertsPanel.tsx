import React from 'react';
import { AlertTriangle, Info, XCircle } from 'lucide-react';
import { clsx } from 'clsx';
import type { Alert, AlertSeverity } from '../../../application/services/AlertService';
import { Card } from '../common/Card';

interface AlertsPanelProps {
  alerts: Alert[];
}

const severityConfig: Record<AlertSeverity, {
  icon: React.ReactNode;
  className: string;
  label: string;
}> = {
  critical: {
    icon: <XCircle className="h-4 w-4 text-red-500" />,
    className: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    label: 'Crítico',
  },
  warning: {
    icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
    className: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
    label: 'Advertencia',
  },
  info: {
    icon: <Info className="h-4 w-4 text-blue-500" />,
    className: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    label: 'Información',
  },
};

export const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts }) => {
  const sortedAlerts = [...alerts].sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 };
    return order[a.severity] - order[b.severity];
  });

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          Alertas activas
        </h3>
        {alerts.length > 0 && (
          <span className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">
            {alerts.length} alerta{alerts.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {sortedAlerts.length === 0 ? (
        <div className="text-center py-6">
          <div className="text-4xl mb-2">✅</div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">¡Todo en orden!</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Sin alertas para el sprint activo</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {sortedAlerts.map((alert) => {
            const config = severityConfig[alert.severity];
            return (
              <div
                key={alert.id}
                className={clsx(
                  'flex gap-3 p-3 rounded-lg border text-sm',
                  config.className
                )}
              >
                <div className="shrink-0 mt-0.5">{config.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white text-xs">{alert.title}</p>
                  <p className="text-gray-600 dark:text-gray-300 text-xs mt-0.5">{alert.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
