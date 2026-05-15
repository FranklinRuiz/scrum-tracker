import React from 'react';
import { AlertTriangle, TrendingUp, Zap } from 'lucide-react';
import { clsx } from 'clsx';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'indigo' | 'red' | 'amber' | 'green';
  trend?: { value: number; label: string };
}

const colorMap = {
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    icon: 'bg-indigo-100 dark:bg-indigo-800 text-indigo-600 dark:text-indigo-400',
    text: 'text-indigo-700 dark:text-indigo-400',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    icon: 'bg-red-100 dark:bg-red-800 text-red-600 dark:text-red-400',
    text: 'text-red-700 dark:text-red-400',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    icon: 'bg-amber-100 dark:bg-amber-800 text-amber-600 dark:text-amber-400',
    text: 'text-amber-700 dark:text-amber-400',
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    icon: 'bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-400',
    text: 'text-green-700 dark:text-green-400',
  },
};

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, color, trend }) => {
  const colors = colorMap[color];
  return (
    <div className={clsx('rounded-xl p-5 border', colors.bg, 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800')}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={clsx('p-3 rounded-xl', colors.icon)}>{icon}</div>
      </div>
      {trend && (
        <div className={clsx('flex items-center gap-1 mt-3 text-xs font-medium', colors.text)}>
          <TrendingUp className="h-3.5 w-3.5" />
          {trend.value > 0 ? '+' : ''}{trend.value} {trend.label}
        </div>
      )}
    </div>
  );
};

interface StatsCardsProps {
  blockedCount: number;
  atRiskCount: number;
  teamVelocity: number;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  blockedCount,
  atRiskCount,
  teamVelocity,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatCard
        title="Historias bloqueadas"
        value={blockedCount}
        subtitle={blockedCount === 0 ? 'Todo en orden' : 'Requieren atención inmediata'}
        icon={<AlertTriangle className="h-5 w-5" />}
        color="red"
      />
      <StatCard
        title="En riesgo"
        value={atRiskCount}
        subtitle={atRiskCount === 0 ? 'Al día' : 'Con retraso'}
        icon={<TrendingUp className="h-5 w-5" />}
        color="amber"
      />
      <StatCard
        title="Velocidad del equipo"
        value={teamVelocity}
        subtitle="pts promedio/sprint"
        icon={<Zap className="h-5 w-5" />}
        color="green"
      />
    </div>
  );
};
