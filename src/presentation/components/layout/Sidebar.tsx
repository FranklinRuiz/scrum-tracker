import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  Settings,
  Zap,
  GitBranch,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAlerts } from '../../hooks/useAlerts';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

export const Sidebar: React.FC = () => {
  const { criticalCount } = useAlerts();

  const navItems: NavItem[] = [
    {
      to: '/',
      label: 'Dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
      badge: criticalCount > 0 ? criticalCount : undefined,
    },
    { to: '/sprints', label: 'Sprints', icon: <GitBranch className="h-5 w-5" /> },
    { to: '/stories', label: 'Historias', icon: <BookOpen className="h-5 w-5" /> },
    { to: '/timeline', label: 'Línea de tiempo', icon: <Calendar className="h-5 w-5" /> },
    { to: '/settings', label: 'Configuración', icon: <Settings className="h-5 w-5" /> },
  ];

  return (
    <aside className="h-full flex flex-col bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 w-64 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-3.5 border-b border-gray-200 dark:border-slate-700">
        <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <div>
          <span className="text-base font-bold text-gray-900 dark:text-white">ScrumTracker</span>
          <p className="text-xs text-gray-500 dark:text-gray-400">Gestión de proyectos</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150',
                isActive
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-slate-800 dark:hover:text-gray-200'
              )
            }
          >
            {item.icon}
            <span className="flex-1">{item.label}</span>
            {item.badge !== undefined && (
              <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {item.badge > 9 ? '9+' : item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200 dark:border-slate-700">
        <p className="text-xs text-gray-400 dark:text-gray-600 text-center">
          v1.0.0 &mdash; Scrum Tracker
        </p>
      </div>
    </aside>
  );
};
