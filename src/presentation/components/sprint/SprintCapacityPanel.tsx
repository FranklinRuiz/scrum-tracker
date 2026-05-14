import React, { useState } from 'react';
import { Plus, Trash2, CalendarOff, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Sprint } from '../../../domain/entities/Sprint';
import type { Developer } from '../../../domain/entities/Developer';
import type { SprintHoliday } from '../../../domain/entities/SprintHoliday';
import type { DeveloperAvailability } from '../../../domain/entities/DeveloperAvailability';
import { ABSENCE_REASON_LABELS } from '../../../domain/entities/DeveloperAvailability';
import { BASE_EFFECTIVE_DAYS, getEffectiveDays, getDevCapacity } from '../../../domain/entities/Sprint';
import { Avatar } from '../common/Avatar';
import { Button } from '../common/Button';
import { Select } from '../common/Select';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface SprintCapacityPanelProps {
  sprint: Sprint;
  developers: Developer[];
  holidays: SprintHoliday[];
  availability: DeveloperAvailability[];
  onAddHoliday: (holiday: SprintHoliday) => Promise<void>;
  onRemoveHoliday: (id: string) => Promise<void>;
  onSaveAvailability: (record: DeveloperAvailability) => Promise<void>;
  onUpdateAvailability: (record: DeveloperAvailability) => Promise<void>;
  onRemoveAvailability: (id: string) => Promise<void>;
}

interface HolidayFormState {
  date: string;
  description: string;
}

interface AvailFormState {
  developerId: string;
  daysOff: number;
  reason: DeveloperAvailability['reason'];
  notes: string;
}

const EMPTY_HOLIDAY: HolidayFormState = { date: '', description: '' };
const EMPTY_AVAIL: AvailFormState = { developerId: '', daysOff: 1, reason: 'vacaciones', notes: '' };

export const SprintCapacityPanel: React.FC<SprintCapacityPanelProps> = ({
  sprint,
  developers,
  holidays,
  availability,
  onAddHoliday,
  onRemoveHoliday,
  onSaveAvailability,
  onUpdateAvailability,
  onRemoveAvailability,
}) => {
  const [showHolidayForm, setShowHolidayForm] = useState(false);
  const [showAvailForm, setShowAvailForm] = useState(false);
  const [holidayForm, setHolidayForm] = useState<HolidayFormState>(EMPTY_HOLIDAY);
  const [availForm, setAvailForm] = useState<AvailFormState>(EMPTY_AVAIL);
  const [editingAvailId, setEditingAvailId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => Promise<void> } | null>(null);

  const effectiveDays = getEffectiveDays(holidays.length);
  const activeDevelopers = developers.filter((d) => d.isActive);

  const getDevAvailability = (devId: string) =>
    availability.find((a) => a.developerId === devId) ?? null;

  const totalCapacity = activeDevelopers.reduce((sum, dev) => {
    const avail = getDevAvailability(dev.id);
    return sum + getDevCapacity(effectiveDays, avail?.daysOff ?? 0);
  }, 0);

  const handleAddHoliday = async () => {
    if (!holidayForm.date) { toast.error('Selecciona una fecha'); return; }
    if (!holidayForm.description.trim()) { toast.error('Ingresa una descripción'); return; }
    setSaving(true);
    try {
      await onAddHoliday({
        id: uuidv4(),
        sprintId: sprint.id,
        date: holidayForm.date,
        description: holidayForm.description.trim(),
      });
      toast.success('Feriado agregado');
      setHolidayForm(EMPTY_HOLIDAY);
      setShowHolidayForm(false);
    } catch {
      toast.error('Error al agregar feriado');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveHoliday = (id: string) => {
    setConfirmDialog({
      message: '¿Eliminar este feriado del sprint?',
      onConfirm: async () => {
        await onRemoveHoliday(id);
        toast.success('Feriado eliminado');
      },
    });
  };

  const handleSaveAvailability = async () => {
    if (!availForm.developerId) { toast.error('Selecciona un desarrollador'); return; }
    if (availForm.daysOff < 1) { toast.error('Los días de ausencia deben ser al menos 1'); return; }
    setSaving(true);
    try {
      if (editingAvailId) {
        await onUpdateAvailability({
          id: editingAvailId,
          sprintId: sprint.id,
          developerId: availForm.developerId,
          daysOff: availForm.daysOff,
          reason: availForm.reason,
          notes: availForm.notes,
        });
        toast.success('Disponibilidad actualizada');
      } else {
        await onSaveAvailability({
          id: uuidv4(),
          sprintId: sprint.id,
          developerId: availForm.developerId,
          daysOff: availForm.daysOff,
          reason: availForm.reason,
          notes: availForm.notes,
        });
        toast.success('Ausencia registrada');
      }
      setAvailForm(EMPTY_AVAIL);
      setEditingAvailId(null);
      setShowAvailForm(false);
    } catch {
      toast.error('Error al guardar disponibilidad');
    } finally {
      setSaving(false);
    }
  };

  const handleEditAvail = (record: DeveloperAvailability) => {
    setAvailForm({
      developerId: record.developerId,
      daysOff: record.daysOff,
      reason: record.reason,
      notes: record.notes,
    });
    setEditingAvailId(record.id);
    setShowAvailForm(true);
  };

  const handleRemoveAvail = (id: string) => {
    setConfirmDialog({
      message: '¿Eliminar este registro de ausencia?',
      onConfirm: async () => {
        await onRemoveAvailability(id);
        toast.success('Ausencia eliminada');
      },
    });
  };

  const cancelAvailForm = () => {
    setAvailForm(EMPTY_AVAIL);
    setEditingAvailId(null);
    setShowAvailForm(false);
  };

  // Developers already with an availability record (not being edited)
  const takenDevIds = availability
    .filter((a) => a.id !== editingAvailId)
    .map((a) => a.developerId);
  const availableDevs = activeDevelopers.filter((d) => !takenDevIds.includes(d.id));

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
      {/* Header */}
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-indigo-500" />
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            Capacidad del sprint
          </span>
          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
            {totalCapacity} pts totales
          </span>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-5 border-t border-gray-100 dark:border-slate-700 pt-4">
          {/* Effective days summary */}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500 dark:text-gray-400">Días base:</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">{BASE_EFFECTIVE_DAYS}</span>
            </div>
            <span className="text-gray-300 dark:text-gray-600">−</span>
            <div className="flex items-center gap-1.5">
              <CalendarOff className="h-3.5 w-3.5 text-orange-400" />
              <span className="text-gray-500 dark:text-gray-400">Feriados:</span>
              <span className="font-semibold text-orange-500">{holidays.length}</span>
            </div>
            <span className="text-gray-300 dark:text-gray-600">=</span>
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500 dark:text-gray-400">Días efectivos:</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">{effectiveDays}</span>
            </div>
          </div>

          {/* Holidays section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Feriados
              </h4>
              {!showHolidayForm && (
                <button
                  onClick={() => setShowHolidayForm(true)}
                  className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" /> Agregar feriado
                </button>
              )}
            </div>

            {holidays.length === 0 && !showHolidayForm && (
              <p className="text-xs text-gray-400 dark:text-gray-500 italic">Sin feriados registrados</p>
            )}

            <div className="space-y-1.5">
              {holidays.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between bg-orange-50 dark:bg-orange-900/20 rounded-lg px-3 py-1.5"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarOff className="h-3.5 w-3.5 text-orange-400 shrink-0" />
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {format(new Date(h.date + 'T12:00:00'), "d 'de' MMMM yyyy", { locale: es })}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">— {h.description}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveHoliday(h.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-0.5"
                    title="Eliminar feriado"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {showHolidayForm && (
              <div className="mt-2 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg space-y-2">
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={holidayForm.date}
                    min={sprint.startDate}
                    max={sprint.endDate}
                    onChange={(e) => setHolidayForm((f) => ({ ...f, date: e.target.value }))}
                    className="text-sm px-2 py-1.5 rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Descripción del feriado"
                    value={holidayForm.description}
                    onChange={(e) => setHolidayForm((f) => ({ ...f, description: e.target.value }))}
                    className="flex-1 text-sm px-2 py-1.5 rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="ghost" onClick={() => { setHolidayForm(EMPTY_HOLIDAY); setShowHolidayForm(false); }}>
                    Cancelar
                  </Button>
                  <Button size="sm" variant="primary" onClick={handleAddHoliday} isLoading={saving}>
                    Guardar
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Developer capacity table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Capacidad por desarrollador
              </h4>
              {!showAvailForm && availableDevs.length > 0 && (
                <button
                  onClick={() => setShowAvailForm(true)}
                  className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" /> Registrar ausencia
                </button>
              )}
            </div>

            <div className="rounded-lg border border-gray-200 dark:border-slate-600 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-slate-700/50">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">Desarrollador</th>
                    <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">Días efect.</th>
                    <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">Ausencias</th>
                    <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">Capacidad</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">Motivo</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {activeDevelopers.map((dev) => {
                    const avail = getDevAvailability(dev.id);
                    const daysOff = avail?.daysOff ?? 0;
                    const capacity = getDevCapacity(effectiveDays, daysOff);
                    return (
                      <tr key={dev.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <Avatar developer={dev} size="sm" />
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100 text-xs">{dev.name}</p>
                              <p className="text-gray-400 dark:text-gray-500 text-xs">{dev.role}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center text-gray-600 dark:text-gray-300">{effectiveDays}</td>
                        <td className="px-3 py-2 text-center">
                          {daysOff > 0 ? (
                            <span className="text-orange-500 font-medium">-{daysOff}</span>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={`font-bold ${capacity < effectiveDays ? 'text-amber-500' : 'text-indigo-600 dark:text-indigo-400'}`}>
                            {capacity}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                          {avail ? ABSENCE_REASON_LABELS[avail.reason] : '—'}
                          {avail?.notes ? <span className="block text-gray-400 italic truncate max-w-[120px]">{avail.notes}</span> : null}
                        </td>
                        <td className="px-3 py-2">
                          {avail && (
                            <div className="flex items-center gap-1 justify-end">
                              <button
                                onClick={() => handleEditAvail(avail)}
                                className="text-xs text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 px-1"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => handleRemoveAvail(avail.id)}
                                className="text-gray-400 hover:text-red-500 transition-colors p-0.5"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50 dark:bg-slate-700/50 border-t border-gray-200 dark:border-slate-600">
                  <tr>
                    <td colSpan={3} className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 text-right">
                      Capacidad total del equipo:
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">{totalCapacity}</span>
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {showAvailForm && (
              <div className="mt-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg space-y-2">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {editingAvailId ? 'Editar ausencia' : 'Registrar ausencia'}
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Select
                    sm
                    value={availForm.developerId}
                    onChange={(e) => setAvailForm((f) => ({ ...f, developerId: e.target.value }))}
                    wrapperClassName="col-span-2 sm:col-span-1"
                  >
                    <option value="">Desarrollador...</option>
                    {(editingAvailId ? activeDevelopers : availableDevs).map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </Select>
                  <input
                    type="number"
                    min={1}
                    max={effectiveDays}
                    value={availForm.daysOff}
                    onChange={(e) => setAvailForm((f) => ({ ...f, daysOff: parseInt(e.target.value) || 1 }))}
                    placeholder="Días"
                    className="text-sm px-2 py-1.5 rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <Select
                    sm
                    value={availForm.reason}
                    onChange={(e) => setAvailForm((f) => ({ ...f, reason: e.target.value as DeveloperAvailability['reason'] }))}
                  >
                    {(Object.entries(ABSENCE_REASON_LABELS) as [DeveloperAvailability['reason'], string][]).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </Select>
                  <input
                    type="text"
                    placeholder="Notas (opcional)"
                    value={availForm.notes}
                    onChange={(e) => setAvailForm((f) => ({ ...f, notes: e.target.value }))}
                    className="text-sm px-2 py-1.5 rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none col-span-2 sm:col-span-1"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="ghost" onClick={cancelAvailForm}>Cancelar</Button>
                  <Button size="sm" variant="primary" onClick={handleSaveAvailability} isLoading={saving}>
                    {editingAvailId ? 'Actualizar' : 'Guardar'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!confirmDialog}
        onClose={() => setConfirmDialog(null)}
        onConfirm={async () => {
          if (!confirmDialog) return;
          try {
            await confirmDialog.onConfirm();
          } catch {
            toast.error('Error al eliminar');
          } finally {
            setConfirmDialog(null);
          }
        }}
        title="Confirmar eliminación"
        message={confirmDialog?.message ?? ''}
        detail="Esta acción no se puede deshacer."
      />
    </div>
  );
};
