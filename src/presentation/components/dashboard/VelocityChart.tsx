import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { VelocityDataPoint } from '@/application/use-cases/dashboard/GetDashboardDataUseCase';
import { Card } from '../common/Card';

interface VelocityChartProps {
  data: VelocityDataPoint[];
}

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; fill: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg p-3">
      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-sm">
          <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: entry.fill }} />
          <span className="text-gray-600 dark:text-gray-400">{entry.name}:</span>
          <span className="font-semibold text-gray-900 dark:text-white">{entry.value} pts</span>
        </div>
      ))}
    </div>
  );
};

export const VelocityChart: React.FC<VelocityChartProps> = ({ data }) => {
  return (
    <Card className="h-full">
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
        Velocidad del equipo
      </h3>
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-[280px] text-gray-400 dark:text-gray-500 text-sm">
          Sin datos de sprints
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" stroke="#9ca3af" />
            <XAxis
              dataKey="sprint"
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '16px', fontSize: '12px' }} />
            <Bar dataKey="committed" name="Comprometidos" fill="#c7d2fe" radius={[4, 4, 0, 0]} />
            <Bar dataKey="completed" name="Completados" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
};
