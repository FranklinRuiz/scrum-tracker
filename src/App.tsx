import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Layout } from './presentation/components/layout/Layout';
import { DashboardPage } from './presentation/pages/DashboardPage';
import { SprintsPage } from './presentation/pages/SprintsPage';
import { StoriesPage } from './presentation/pages/StoriesPage';
import { TimelinePage } from './presentation/pages/TimelinePage';
import { SettingsPage } from './presentation/pages/SettingsPage';
import { useAppStore } from './presentation/store/useAppStore';
import { Spinner } from './presentation/components/common/Spinner';

function AppContent() {
  const { initialize, isLoading, error } = useAppStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-white dark:bg-slate-950 gap-4">
        <div className="h-12 w-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
          <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <Spinner size="md" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Cargando Scrum Tracker...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-white dark:bg-slate-950 gap-4 p-6">
        <div className="text-red-500 text-5xl">⚠️</div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Error al cargar</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm text-center">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="sprints" element={<SprintsPage />} />
        <Route path="stories" element={<StoriesPage />} />
        <Route path="timeline" element={<TimelinePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'var(--toast-bg, #fff)',
            color: 'var(--toast-color, #1f2937)',
            borderRadius: '10px',
            border: '1px solid var(--toast-border, #e5e7eb)',
            fontSize: '0.875rem',
            fontWeight: 500,
            padding: '10px 14px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
          },
        }}
      />
    </BrowserRouter>
  );
}

export default App;
