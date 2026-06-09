import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock } from 'lucide-react';
import type { ProgressRecord } from '@/domain/entities/ProgressRecord';
import type { Developer } from '@/domain/entities/Developer';
import { Card } from '../common/Card';

interface HoursPerDayChartProps {
  progressRecords: ProgressRecord[];
  developers: Developer[];
  sprintStartDate: string;
  sprintEndDate: string;
}

type DayRow = Record<string, string | number>;

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  const withHours = payload.filter((e) => e.value > 0);
  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg p-3 min-w-[160px]">
      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">{label}</p>
      {withHours.length === 0 ? (
        <p className="text-xs text-gray-400 dark:text-gray-500 italic">Sin horas registradas</p>
      ) : (
        withHours.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
              <span className="text-gray-600 dark:text-gray-300">{entry.name}</span>
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">{entry.value}h</span>
          </div>
        ))
      )}
    </div>
  );
};

export const HoursPerDayChart: React.FC<HoursPerDayChartProps> = ({
  progressRecords,
  developers,
  sprintStartDate,
  sprintEndDate,
}) => {
  const activeDevelopers = useMemo(
    () => developers.filter((d) => d.isActive),
    [developers]
  );

  const chartData = useMemo((): DayRow[] => {
    const start = new Date(sprintStartDate + 'T12:00:00');
    const end = new Date(sprintEndDate + 'T12:00:00');
    const today = new Date();
    const cutoff = end < today ? end : today;

    const rows: DayRow[] = [];
    const current = new Date(start);

    while (current <= cutoff) {
      const dow = current.getDay();
      if (dow !== 0 && dow !== 6) {
        const dateStr = format(current, 'yyyy-MM-dd');
        const label = format(current, 'd MMM', { locale: es });
        const row: DayRow = { date: label };

        for (const dev of activeDevelopers) {
          row[dev.name] = progressRecords
            .filter((p) => p.developerId === dev.id && p.timestamp.startsWith(dateStr))
            .reduce((sum, p) => sum + p.hoursWorked, 0);
        }

        rows.push(row);
      }
      current.setDate(current.getDate() + 1);
    }

    return rows;
  }, [progressRecords, activeDevelopers, sprintStartDate, sprintEndDate]);

  const hasAnyHours = chartData.some((row) =>
    activeDevelopers.some((dev) => (row[dev.name] as number) > 0)
  );

  return (
    <Card className="h-full">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-4 w-4 text-indigo-500" />
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          Horas trabajadas por día
        </h3>
      </div>

      {!hasAnyHours ? (
        <div className="flex items-center justify-center h-[280px] text-gray-400 dark:text-gray-500 text-sm">
          Sin registros de progreso en este sprint
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" stroke="#9ca3af" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              className="text-gray-500 dark:text-gray-400"
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              unit="h"
              className="text-gray-500 dark:text-gray-400"
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '16px', fontSize: '12px' }} />
            {activeDevelopers.map((dev) => (
              <Line
                key={dev.id}
                type="monotone"
                dataKey={dev.name}
                stroke={dev.avatarColor}
                strokeWidth={2.5}
                dot={{ fill: dev.avatarColor, r: 3 }}
                activeDot={{ r: 5 }}
                connectNulls={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
};
