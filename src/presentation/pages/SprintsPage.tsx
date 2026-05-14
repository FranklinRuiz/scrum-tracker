import React, { useState } from 'react';
import { Plus, GitBranch } from 'lucide-react';
import { isTerminalStatus } from '../../domain/value-objects/StoryStatus';
import toast from 'react-hot-toast';
import { useSprint } from '../hooks/useSprint';
import { useAppStore } from '../store/useAppStore';
import { SprintCard } from '../components/sprint/SprintCard';
import { SprintForm } from '../components/sprint/SprintForm';
import { SprintCapacityPanel } from '../components/sprint/SprintCapacityPanel';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import type { Sprint } from '../../domain/entities/Sprint';
import type { CreateSprintInput } from '../../application/use-cases/sprint/CreateSprintUseCase';

export const SprintsPage: React.FC = () => {
  const { sprints, selectedSprintId, setSelectedSprint, createSprint, updateSprint, deleteSprint, getSprintProgress } =
    useSprint();
  const {
    stories,
    progressRecords,
    developers,
    holidays,
    availability,
    getHolidaysBySprint,
    getAvailabilityBySprint,
    addHoliday,
    removeHoliday,
    saveAvailability,
    updateAvailability,
    removeAvailability,
  } = useAppStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
  const [deletingSprint, setDeletingSprint] = useState<Sprint | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async (input: CreateSprintInput) => {
    setIsLoading(true);
    try {
      await createSprint(input);
      toast.success('Sprint creado correctamente');
      setIsFormOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al crear el sprint');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (input: CreateSprintInput) => {
    if (!editingSprint) return;
    setIsLoading(true);
    try {
      await updateSprint({ id: editingSprint.id, ...input });
      toast.success('Sprint actualizado');
      setEditingSprint(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al actualizar el sprint');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (sprint: Sprint) => {
    setDeletingSprint(sprint);
  };

  const handleConfirmDeleteSprint = async () => {
    if (!deletingSprint) return;
    try {
      await deleteSprint(deletingSprint.id);
      toast.success('Sprint eliminado');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar el sprint');
    } finally {
      setDeletingSprint(null);
    }
  };

  const sprintsByGroup = {
    active: sprints.filter((s) => s.status === 'active'),
    planned: sprints.filter((s) => s.status === 'planned'),
    completed: sprints.filter((s) => s.status === 'completed'),
  };

  const getCompletedPoints = (sprintId: string) => {
    const sprintStories = stories.filter((s) => s.sprintId === sprintId);
    const storyIdsWithCommitmentMet = new Set(
      progressRecords.filter((p) => p.commitmentMet).map((p) => p.storyId)
    );
    return sprintStories
      .filter((s) => isTerminalStatus(s.status) || storyIdsWithCommitmentMet.has(s.id))
      .reduce((sum, s) => sum + s.points, 0);
  };

  const selectedSprint = sprints.find((s) => s.id === selectedSprintId) ?? null;
  const sprintHolidays = selectedSprintId ? getHolidaysBySprint(selectedSprintId) : [];
  const sprintAvailability = selectedSprintId ? getAvailabilityBySprint(selectedSprintId) : [];

  // suppress unused-var warnings — holidays/availability used via selectors
  void holidays;
  void availability;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{sprints.length} sprints en total</p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setIsFormOpen(true)}
        >
          Nuevo Sprint
        </Button>
      </div>

      {sprints.length === 0 ? (
        <EmptyState
          icon={<GitBranch className="h-16 w-16" />}
          title="Sin sprints aún"
          description="Crea tu primer sprint para comenzar la planificación."
          action={
            <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsFormOpen(true)}>
              Crear Sprint
            </Button>
          }
        />
      ) : (
        <div className="space-y-8">
          {sprintsByGroup.active.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider mb-3">
                Activo ({sprintsByGroup.active.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {sprintsByGroup.active.map((sprint) => (
                  <SprintCard
                    key={sprint.id}
                    sprint={sprint}
                    progress={getSprintProgress(sprint.id)}
                    completedPoints={getCompletedPoints(sprint.id)}
                    totalStories={stories.filter((s) => s.sprintId === sprint.id).length}
                    onEdit={setEditingSprint}
                    onDelete={handleDelete}
                    onSelect={(s) => setSelectedSprint(s.id)}
                    isSelected={selectedSprintId === sprint.id}
                  />
                ))}
              </div>
            </section>
          )}

          {sprintsByGroup.planned.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Planificado ({sprintsByGroup.planned.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {sprintsByGroup.planned.map((sprint) => (
                  <SprintCard
                    key={sprint.id}
                    sprint={sprint}
                    progress={getSprintProgress(sprint.id)}
                    completedPoints={getCompletedPoints(sprint.id)}
                    totalStories={stories.filter((s) => s.sprintId === sprint.id).length}
                    onEdit={setEditingSprint}
                    onDelete={handleDelete}
                    onSelect={(s) => setSelectedSprint(s.id)}
                    isSelected={selectedSprintId === sprint.id}
                  />
                ))}
              </div>
            </section>
          )}

          {sprintsByGroup.completed.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-blue-500 dark:text-blue-400 uppercase tracking-wider mb-3">
                Completado ({sprintsByGroup.completed.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {sprintsByGroup.completed.map((sprint) => (
                  <SprintCard
                    key={sprint.id}
                    sprint={sprint}
                    progress={getSprintProgress(sprint.id)}
                    completedPoints={getCompletedPoints(sprint.id)}
                    totalStories={stories.filter((s) => s.sprintId === sprint.id).length}
                    onEdit={setEditingSprint}
                    onDelete={handleDelete}
                    onSelect={(s) => setSelectedSprint(s.id)}
                    isSelected={selectedSprintId === sprint.id}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Capacity panel for selected sprint */}
          {selectedSprint && (
            <section>
              <SprintCapacityPanel
                sprint={selectedSprint}
                developers={developers}
                holidays={sprintHolidays}
                availability={sprintAvailability}
                onAddHoliday={addHoliday}
                onRemoveHoliday={removeHoliday}
                onSaveAvailability={saveAvailability}
                onUpdateAvailability={updateAvailability}
                onRemoveAvailability={removeAvailability}
              />
            </section>
          )}
        </div>
      )}

      {/* Create form */}
      <SprintForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreate}
        isLoading={isLoading}
      />

      {/* Edit form */}
      {editingSprint && (
        <SprintForm
          isOpen={!!editingSprint}
          onClose={() => setEditingSprint(null)}
          onSubmit={handleEdit}
          initialData={editingSprint}
          isLoading={isLoading}
        />
      )}

      <ConfirmDialog
        isOpen={!!deletingSprint}
        onClose={() => setDeletingSprint(null)}
        onConfirm={handleConfirmDeleteSprint}
        title="Eliminar sprint"
        message={
          deletingSprint
            ? <>¿Eliminar el sprint <strong className="text-gray-900 dark:text-white">"{deletingSprint.name}"</strong>? Todas las historias asociadas también serán eliminadas.</>
            : ''
        }
        detail="Esta acción no se puede deshacer."
      />
    </div>
  );
};
