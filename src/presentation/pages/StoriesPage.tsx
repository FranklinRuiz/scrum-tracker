import React, { useState, useMemo } from 'react';
import { Plus, Search, Filter, BookOpen, X, SortAsc, Trash2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppStore } from '../store/useAppStore';
import { StoryCard } from '../components/story/StoryCard';
import { StoryForm } from '../components/story/StoryForm';
import { StoryDetail } from '../components/story/StoryDetail';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { Select } from '../components/common/Select';
import { SprintSelector } from '../components/sprint/SprintSelector';
import type { UserStory } from '@/domain/entities/UserStory.ts';
import type { StoryStatus } from '@/domain/value-objects/StoryStatus.ts';
import type { Priority } from '@/domain/value-objects/Priority.ts';
import type { CreateStoryInput } from '@/application/use-cases/story/CreateStoryUseCase.ts';
import { STORY_STATUS_LABELS, isTerminalStatus } from '@/domain/value-objects/StoryStatus.ts';
import { clsx } from 'clsx';

type SortField = 'priority' | 'points' | 'status' | 'title' | 'commitmentDate';

const PRIORITY_ORDER: Record<Priority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const STATUS_ORDER: Record<StoryStatus, number> = {
  'blocked': 0,
  'open': 1,
  'in-development': 2,
  'done-development': 3,
  'in-certification': 4,
  'done-certification': 5,
  'pase-management': 6,
  'finalized': 7,
  'done-prd': 8,
};

const ALL_STATUSES: StoryStatus[] = [
  'open',
  'blocked',
  'in-development',
  'done-development',
  'in-certification',
  'done-certification',
  'pase-management',
  'finalized',
  'done-prd',
];

const ALL_PRIORITIES: Priority[] = ['critical', 'high', 'medium', 'low'];

export const StoriesPage: React.FC = () => {
  const {
    sprints,
    stories,
    progressRecords,
    developers,
    selectedSprintId,
    setSelectedSprint,
    createStory,
    updateStory,
    deleteStory,
    addProgress,
    editProgress,
    deleteProgress,
  } = useAppStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStory, setEditingStory] = useState<UserStory | null>(null);
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const selectedStory = selectedStoryId ? (stories.find((s) => s.id === selectedStoryId) ?? null) : null;
  const [deletingStory, setDeletingStory] = useState<UserStory | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<StoryStatus | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('priority');
  const [showFilters, setShowFilters] = useState(false);

  const filteredStories = useMemo(() => {
    let result = selectedSprintId
      ? stories.filter((s) => s.sprintId === selectedSprintId)
      : stories;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((s) => s.title.toLowerCase().includes(q));
    }

    if (filterStatus !== 'all') {
      result = result.filter((s) => s.status === filterStatus);
    }

    if (filterPriority !== 'all') {
      result = result.filter((s) => s.priority === filterPriority);
    }

    result = [...result].sort((a, b) => {
      switch (sortField) {
        case 'priority':
          return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
        case 'points':
          return b.points - a.points;
        case 'status':
          return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
        case 'title':
          return a.title.localeCompare(b.title);
        case 'commitmentDate':
          return a.commitmentDate.localeCompare(b.commitmentDate);
        default:
          return 0;
      }
    });

    return result;
  }, [stories, selectedSprintId, searchQuery, filterStatus, filterPriority, sortField]);

  const stats = useMemo(() => {
    const total = filteredStories.length;
    const blocked = filteredStories.filter((s) => s.isBlocked).length;
    const completed = filteredStories.filter((s) => isTerminalStatus(s.status)).length;
    const totalPoints = filteredStories.reduce((sum, s) => sum + s.points, 0);
    return { total, blocked, completed, totalPoints };
  }, [filteredStories]);

  const handleCreate = async (
    input: CreateStoryInput & {
      status?: StoryStatus;
      progress?: number;
      isBlocked?: boolean;
      blockReason?: string;
    }
  ) => {
    setIsLoading(true);
    try {
      await createStory(input);
      toast.success('Historia creada correctamente');
      setIsFormOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al crear la historia');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (
    input: CreateStoryInput & {
      status?: StoryStatus;
      progress?: number;
      isBlocked?: boolean;
      blockReason?: string;
    }
  ) => {
    if (!editingStory) return;
    setIsLoading(true);
    try {
      await updateStory({
        id: editingStory.id,
        ...input,
      });
      toast.success('Historia actualizada');
      setEditingStory(null);
      // selectedStory is derived from stories — refreshes automatically
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al actualizar la historia');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (story: UserStory) => {
    setDeletingStory(story);
  };

  const handleConfirmDelete = async () => {
    if (!deletingStory) return;
    try {
      await deleteStory(deletingStory.id);
      toast.success('Historia eliminada');
      if (selectedStoryId === deletingStory.id) setSelectedStoryId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar la historia');
    } finally {
      setDeletingStory(null);
    }
  };

  const handleAddProgress = async (data: {
    storyId: string;
    developerId: string;
    hoursWorked: number;
    comment: string;
    newStatus: StoryStatus;
    commitmentMet: boolean;
  }) => {
    try {
      await addProgress(data);
      toast.success('Avance registrado');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al registrar el avance');
    }
  };

  const handleEditProgress = async (recordId: string, data: {
    storyId: string; developerId: string; hoursWorked: number;
    comment: string; newStatus: StoryStatus; commitmentMet: boolean;
  }) => {
    try {
      await editProgress({ recordId, ...data });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al editar el avance');
    }
  };

  const handleDeleteProgress = async (recordId: string, storyId: string) => {
    try {
      await deleteProgress(recordId, storyId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar el avance');
    }
  };

  const handleStatusChange = async (storyId: string, newStatus: StoryStatus) => {
    try {
      await updateStory({ id: storyId, status: newStatus });
      toast.success('Estado actualizado');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al cambiar el estado');
    }
  };

  const activeFiltersCount = (filterStatus !== 'all' ? 1 : 0) + (filterPriority !== 'all' ? 1 : 0);

  const selectedStoryProgressRecords = selectedStory
    ? progressRecords.filter((p) => p.storyId === selectedStory.id)
    : [];

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-3">
        {/* Row 1: Sprint selector + Add button */}
        <div className="flex items-center gap-4">
          <div className="w-72">
            <SprintSelector
              sprints={sprints}
              selectedId={selectedSprintId}
              onSelect={setSelectedSprint}
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span>{stats.total} historias</span>
            <span className="text-gray-300 dark:text-gray-600">·</span>
            <span>{stats.totalPoints} pts</span>
            {stats.blocked > 0 && (
              <>
                <span className="text-gray-300 dark:text-gray-600">·</span>
                <span className="text-red-500 font-medium">{stats.blocked} bloqueadas</span>
              </>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={
                <span className="relative">
                  <Filter className="h-4 w-4" />
                  {activeFiltersCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 bg-indigo-500 rounded-full text-white text-[9px] flex items-center justify-center font-bold">
                      {activeFiltersCount}
                    </span>
                  )}
                </span>
              }
              onClick={() => setShowFilters((v) => !v)}
            >
              Filtros
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setIsFormOpen(true)}
            >
              Nueva Historia
            </Button>
          </div>
        </div>

        {/* Row 2: Search */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por título..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <SortAsc className="h-4 w-4 text-gray-400" />
            <Select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              wrapperClassName="w-48"
            >
              <option value="priority">Ordenar: Prioridad</option>
              <option value="points">Ordenar: Puntos</option>
              <option value="status">Ordenar: Estado</option>
              <option value="title">Ordenar: Título</option>
              <option value="commitmentDate">Ordenar: Fecha compromiso</option>
            </Select>
          </div>
        </div>

        {/* Row 3: Filters (collapsible) */}
        {showFilters && (
          <div className="flex items-center gap-3 pt-2 pb-1 flex-wrap">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Filtrar:</span>

            {/* Filtro por estado */}
            <div className="flex items-center gap-1 flex-wrap">
              <button
                onClick={() => setFilterStatus('all')}
                className={clsx(
                  'px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                  filterStatus === 'all'
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'
                )}
              >
                Todos los estados
              </button>
              {ALL_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s === filterStatus ? 'all' : s)}
                  className={clsx(
                    'px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                    filterStatus === s
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                      : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'
                  )}
                >
                  {STORY_STATUS_LABELS[s]}
                </button>
              ))}
            </div>

            <span className="text-gray-300 dark:text-gray-600">|</span>

            {/* Filtro por prioridad */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setFilterPriority('all')}
                className={clsx(
                  'px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                  filterPriority === 'all'
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'
                )}
              >
                Todas las prioridades
              </button>
              {ALL_PRIORITIES.map((p) => (
                <button
                  key={p}
                  onClick={() => setFilterPriority(p === filterPriority ? 'all' : p)}
                  className={clsx(
                    'px-2.5 py-1 rounded-full text-xs font-medium transition-colors capitalize',
                    filterPriority === p
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                      : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'
                  )}
                >
                  {p}
                </button>
              ))}
            </div>

            {activeFiltersCount > 0 && (
              <button
                onClick={() => {
                  setFilterStatus('all');
                  setFilterPriority('all');
                }}
                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 ml-2"
              >
                <X className="h-3 w-3" />
                Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredStories.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="h-16 w-16" />}
            title={searchQuery || activeFiltersCount > 0 ? 'No hay historias que coincidan' : 'Sin historias aún'}
            description={
              searchQuery || activeFiltersCount > 0
                ? 'Intenta ajustar los filtros o el término de búsqueda.'
                : 'Crea tu primera Historia de Usuario para hacer seguimiento en este sprint.'
            }
            action={
              !searchQuery && activeFiltersCount === 0 ? (
                <Button
                  variant="primary"
                  leftIcon={<Plus className="h-4 w-4" />}
                  onClick={() => setIsFormOpen(true)}
                >
                  Crear Historia
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filteredStories.map((story) => (
              <div key={story.id} className="relative group">
                <StoryCard
                  story={story}
                  developers={developers}
                  onClick={() => setSelectedStoryId(story.id)}
                />
                {/* Action buttons on hover */}
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingStory(story);
                    }}
                    className="p-1.5 rounded-md bg-white dark:bg-slate-700 shadow-sm border border-gray-200 dark:border-slate-600 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    title="Edit story"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(story);
                    }}
                    className="p-1.5 rounded-md bg-white dark:bg-slate-700 shadow-sm border border-gray-200 dark:border-slate-600 text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    title="Delete story"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Form */}
      <StoryForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreate}
        sprints={sprints}
        developers={developers}
        defaultSprintId={selectedSprintId ?? undefined}
        isLoading={isLoading}
      />

      {/* Edit Form */}
      {editingStory && (
        <StoryForm
          isOpen={!!editingStory}
          onClose={() => setEditingStory(null)}
          onSubmit={handleEdit}
          initialData={editingStory}
          sprints={sprints}
          developers={developers}
          isLoading={isLoading}
        />
      )}

      {/* Panel de detalle de Historia */}
      {selectedStory && (
        <StoryDetail
          story={selectedStory}
          developers={developers}
          progressRecords={selectedStoryProgressRecords}
          onClose={() => setSelectedStoryId(null)}
          onAddProgress={handleAddProgress}
          onEditProgress={handleEditProgress}
          onDeleteProgress={handleDeleteProgress}
          onStatusChange={handleStatusChange}
          onEdit={() => {
            setEditingStory(selectedStory);
            setSelectedStoryId(null);
          }}
        />
      )}

      {/* Modal de confirmación de eliminación */}
      <Modal
        isOpen={!!deletingStory}
        onClose={() => setDeletingStory(null)}
        title="Eliminar historia"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeletingStory(null)}>Cancelar</Button>
            <Button variant="danger" leftIcon={<Trash2 className="h-4 w-4" />} onClick={handleConfirmDelete}>
              Eliminar
            </Button>
          </>
        }
      >
        <div className="flex flex-col items-center gap-4 py-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              ¿Estás seguro de que quieres eliminar esta historia?
            </p>
            {deletingStory && (
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                "{deletingStory.title}"
              </p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 pt-1">Esta acción no se puede deshacer.</p>
          </div>
        </div>
      </Modal>
    </div>
  );
};
