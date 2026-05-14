import React, { useRef, useState } from 'react';
import { Moon, Sun, Download, Upload } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useAppStore } from '../../store/useAppStore';
import { BackupService } from '../../../infrastructure/persistence/BackupService';
import { Button } from '../common/Button';
import { ConfirmDialog } from '../common/ConfirmDialog';
import toast from 'react-hot-toast';

interface HeaderProps {
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  const { isDark, toggleTheme } = useTheme();
  const { sprints, stories, progressRecords, developers, holidays, availability, restoreData } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const handleExport = () => {
    BackupService.exportToJson({
      version: '1.1.0',
      exportedAt: new Date().toISOString(),
      sprints,
      stories,
      progressRecords,
      developers,
      holidays,
      availability,
    });
    toast.success('Backup exportado correctamente');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    e.target.value = '';
  };

  const handleConfirmImport = async () => {
    if (!pendingFile) return;
    try {
      const data = await BackupService.importFromJson(pendingFile);
      await restoreData({
        sprints: data.sprints,
        stories: data.stories,
        progressRecords: data.progressRecords,
        developers: data.developers,
        holidays: data.holidays ?? [],
        availability: data.availability ?? [],
      });
      toast.success('Datos restaurados correctamente');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al importar el backup');
    } finally {
      setPendingFile(null);
    }
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h1>

        <div className="flex items-center gap-2">
          {/* Backup buttons */}
          <Button variant="outline" size="sm" onClick={handleExport} leftIcon={<Download className="h-4 w-4" />}>
            Exportar
          </Button>
          <Button variant="outline" size="sm" onClick={handleImportClick} leftIcon={<Upload className="h-4 w-4" />}>
            Importar
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-slate-700 transition-colors"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!pendingFile}
        onClose={() => setPendingFile(null)}
        onConfirm={handleConfirmImport}
        title="Importar backup"
        message="Importar reemplazará todos los datos actuales con los del archivo seleccionado."
        detail="Esta acción no se puede deshacer."
        confirmLabel="Importar"
        variant="warning"
      />
    </header>
  );
};
