import React, { useState, useRef } from 'react';
import {
  Download,
  Upload,
  Moon,
  Sun,
  Users,
  Plus,
  Pencil,
  Trash2,
  Save,
  AlertTriangle,
  Info,
  Database,
} from 'lucide-react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import { useTheme } from '../hooks/useTheme';
import { useAppStore } from '../store/useAppStore';
import { BackupService } from '../../infrastructure/persistence/BackupService';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Avatar } from '../components/common/Avatar';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import type { Developer } from '../../domain/entities/Developer';

const AVATAR_COLORS = [
  '#6366f1', // indigo
  '#10b981', // emerald
  '#8b5cf6', // violet
  '#f59e0b', // amber
  '#ef4444', // red
  '#3b82f6', // blue
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#84cc16', // lime
];

interface DeveloperFormData {
  name: string;
  email: string;
  role: string;
  avatarColor: string;
  isActive: boolean;
}

const defaultFormData: DeveloperFormData = {
  name: '',
  email: '',
  role: '',
  avatarColor: AVATAR_COLORS[0],
  isActive: true,
};

export const SettingsPage: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const {
    sprints,
    stories,
    progressRecords,
    developers,
    holidays,
    availability,
    saveDeveloper,
    updateDeveloper,
    deleteDeveloper,
    restoreData,
  } = useAppStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [deletingDeveloper, setDeletingDeveloper] = useState<Developer | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isDeveloperModalOpen, setIsDeveloperModalOpen] = useState(false);
  const [editingDeveloper, setEditingDeveloper] = useState<Developer | null>(null);
  const [formData, setFormData] = useState<DeveloperFormData>(defaultFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isFormLoading, setIsFormLoading] = useState(false);

  // Stats
  const stats = {
    sprints: sprints.length,
    stories: stories.length,
    progressRecords: progressRecords.length,
    developers: developers.length,
  };

  // ── Export / Import ──────────────────────────────────────────────────
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

  const handleClearAllData = () => {
    setShowClearConfirm(true);
  };

  const handleConfirmClearAll = () => {
    setShowClearConfirm(false);
    localStorage.clear();
    window.location.reload();
  };

  // ── Developer CRUD ───────────────────────────────────────────────────
  const openCreateModal = () => {
    setEditingDeveloper(null);
    setFormData(defaultFormData);
    setFormErrors({});
    setIsDeveloperModalOpen(true);
  };

  const openEditModal = (dev: Developer) => {
    setEditingDeveloper(dev);
    setFormData({
      name: dev.name,
      email: dev.email,
      role: dev.role,
      avatarColor: dev.avatarColor,
      isActive: dev.isActive,
    });
    setFormErrors({});
    setIsDeveloperModalOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'El nombre es requerido';
    if (!formData.email.trim()) errors.email = 'El email es requerido';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Dirección de email inválida';
    if (!formData.role.trim()) errors.role = 'El rol es requerido';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveDeveloper = async () => {
    if (!validateForm()) return;
    setIsFormLoading(true);
    try {
      if (editingDeveloper) {
        await updateDeveloper({
          ...editingDeveloper,
          name: formData.name.trim(),
          email: formData.email.trim(),
          role: formData.role.trim(),
          avatarColor: formData.avatarColor,
          isActive: formData.isActive,
        });
        toast.success('Desarrollador actualizado');
      } else {
        const newDev: Developer = {
          id: `dev-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          name: formData.name.trim(),
          email: formData.email.trim(),
          role: formData.role.trim(),
          avatarColor: formData.avatarColor,
          isActive: formData.isActive,
        };
        await saveDeveloper(newDev);
        toast.success('Desarrollador agregado');
      }
      setIsDeveloperModalOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar el desarrollador');
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleDeleteDeveloper = (dev: Developer) => {
    setDeletingDeveloper(dev);
  };

  const handleConfirmDeleteDeveloper = async () => {
    if (!deletingDeveloper) return;
    try {
      await deleteDeveloper(deletingDeveloper.id);
      toast.success('Desarrollador eliminado');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar el desarrollador');
    } finally {
      setDeletingDeveloper(null);
    }
  };

  const inputClass =
    'w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';
  const errorClass = 'text-red-500 text-xs mt-1';

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Configuración</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Gestiona tu equipo, preferencias y datos
        </p>
      </div>

      {/* ── Appearance ── */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
            {isDark ? (
              <Moon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            ) : (
              <Sun className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            )}
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Apariencia</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Personaliza el tema visual</p>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {isDark ? 'Modo oscuro' : 'Modo claro'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {isDark
                ? 'Cambiar a modo claro para una interfaz más brillante'
                : 'Cambiar a modo oscuro para una experiencia nocturna cómoda'}
            </p>
          </div>
          <button
            onClick={toggleTheme}
            className={clsx(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
              isDark ? 'bg-indigo-600' : 'bg-gray-200'
            )}
          >
            <span
              className={clsx(
                'inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform',
                isDark ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>
      </Card>

      {/* ── Data Statistics ── */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Resumen de datos</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Datos almacenados localmente</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Sprints', value: stats.sprints, color: 'text-indigo-600 dark:text-indigo-400' },
            { label: 'Historias de Usuario', value: stats.stories, color: 'text-purple-600 dark:text-purple-400' },
            { label: 'Registros de avance', value: stats.progressRecords, color: 'text-green-600 dark:text-green-400' },
            { label: 'Desarrolladores', value: stats.developers, color: 'text-amber-600 dark:text-amber-400' },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="p-3 rounded-lg bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600"
            >
              <p className={clsx('text-2xl font-bold', color)}>{value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Backup & Restore ── */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <Download className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Copia de seguridad</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Exporta tus datos o restaura desde un archivo de backup
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Exportar backup</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Descarga todos los datos como archivo JSON (
                <code className="text-xs bg-gray-100 dark:bg-slate-600 px-1 rounded">
                  scrum-tracker-backup-{new Date().toISOString().split('T')[0]}.json
                </code>
                )
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={handleExport}
            >
              Exportar
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Importar backup</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Restaura los datos desde un archivo JSON exportado previamente
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Upload className="h-4 w-4" />}
              onClick={handleImportClick}
            >
              Importar
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Info */}
          <div className="flex gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Todos los datos se almacenan en el localStorage del navegador. Se recomienda exportar
              un backup antes de limpiar los datos del navegador o cambiar de dispositivo.
            </p>
          </div>
        </div>
      </Card>

      {/* ── Team Management ── */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
              <Users className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Equipo</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Gestiona los desarrolladores y sus roles
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={openCreateModal}
          >
            Agregar desarrollador
          </Button>
        </div>

        {developers.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Sin miembros del equipo aún</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={openCreateModal}
            >
              Agregar primer desarrollador
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {developers.map((dev) => (
              <div
                key={dev.id}
                className={clsx(
                  'flex items-center gap-4 p-3 rounded-lg border transition-colors',
                  dev.isActive
                    ? 'bg-gray-50 dark:bg-slate-700/50 border-gray-200 dark:border-slate-600'
                    : 'bg-gray-50/50 dark:bg-slate-800/30 border-gray-100 dark:border-slate-700 opacity-60'
                )}
              >
                <Avatar developer={dev} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{dev.name}</p>
                    {!dev.isActive && (
                      <Badge className="bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                        Inactivo
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {dev.role} · {dev.email}
                  </p>
                </div>

                {/* Stories count */}
                <div className="text-right text-xs text-gray-400 dark:text-gray-500 shrink-0 hidden sm:block">
                  <p className="font-medium text-gray-700 dark:text-gray-300">
                    {stories.filter((s) => s.assignees.includes(dev.id)).length}
                  </p>
                  <p>historias</p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEditModal(dev)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                    title="Edit developer"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteDeveloper(dev)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Remove developer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── Danger Zone ── */}
      <Card className="border-red-200 dark:border-red-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-red-700 dark:text-red-400">Zona de peligro</h3>
            <p className="text-xs text-red-500 dark:text-red-500">
              Acciones irreversibles y destructivas
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <div>
            <p className="text-sm font-medium text-red-800 dark:text-red-300">Eliminar todos los datos</p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
              Elimina permanentemente todos los sprints, historias y registros de avance. No se puede deshacer.
            </p>
          </div>
          <Button variant="danger" size="sm" onClick={handleClearAllData}>
            Eliminar todo
          </Button>
        </div>
      </Card>

      {/* ── Developer Form Modal ── */}
      <Modal
        isOpen={isDeveloperModalOpen}
        onClose={() => setIsDeveloperModalOpen(false)}
        title={editingDeveloper ? 'Editar desarrollador' : 'Agregar desarrollador'}
        size="md"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setIsDeveloperModalOpen(false)}
              disabled={isFormLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              isLoading={isFormLoading}
              leftIcon={<Save className="h-4 w-4" />}
              onClick={handleSaveDeveloper}
            >
              {editingDeveloper ? 'Guardar cambios' : 'Agregar desarrollador'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Preview */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
            <Avatar
              developer={{
                id: 'preview',
                name: formData.name || 'Vista previa',
                email: formData.email,
                role: formData.role,
                avatarColor: formData.avatarColor,
                isActive: formData.isActive,
              }}
              size="md"
              showName
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nombre completo *</label>
              <input
                type="text"
                className={inputClass}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ana García"
              />
              {formErrors.name && <p className={errorClass}>{formErrors.name}</p>}
            </div>
            <div>
              <label className={labelClass}>Email *</label>
              <input
                type="email"
                className={inputClass}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="ana@company.com"
              />
              {formErrors.email && <p className={errorClass}>{formErrors.email}</p>}
            </div>
          </div>

          <div>
            <label className={labelClass}>Rol / Cargo *</label>
            <input
              type="text"
              className={inputClass}
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              placeholder="Frontend Developer, QA Engineer, etc."
            />
            {formErrors.role && <p className={errorClass}>{formErrors.role}</p>}
          </div>

          <div>
            <label className={labelClass}>Color de avatar</label>
            <div className="flex items-center gap-2 flex-wrap mt-1">
              {AVATAR_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, avatarColor: color })}
                  className={clsx(
                    'h-7 w-7 rounded-full transition-transform hover:scale-110',
                    formData.avatarColor === color
                      ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-400 scale-110'
                      : ''
                  )}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Miembro activo del equipo
            </label>
          </div>
        </div>
      </Modal>

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

      <ConfirmDialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleConfirmClearAll}
        title="Eliminar todos los datos"
        message="Esto eliminará permanentemente todos los sprints, historias y registros de avance."
        detail="Esta acción es irreversible y no se puede deshacer."
        confirmLabel="Eliminar todo"
      />

      <ConfirmDialog
        isOpen={!!deletingDeveloper}
        onClose={() => setDeletingDeveloper(null)}
        onConfirm={handleConfirmDeleteDeveloper}
        title="Eliminar desarrollador"
        message={
          deletingDeveloper
            ? <>¿Eliminar a <strong className="text-gray-900 dark:text-white">{deletingDeveloper.name}</strong>? Será desasignado de todas las historias.</>
            : ''
        }
        detail="Esta acción no se puede deshacer."
      />
    </div>
  );
};
