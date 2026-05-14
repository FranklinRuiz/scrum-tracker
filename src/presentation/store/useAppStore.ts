import { create } from 'zustand';
import type { Sprint } from '../../domain/entities/Sprint';
import type { UserStory } from '../../domain/entities/UserStory';
import type { ProgressRecord } from '../../domain/entities/ProgressRecord';
import type { Developer } from '../../domain/entities/Developer';
import type { SprintHoliday } from '../../domain/entities/SprintHoliday';
import type { DeveloperAvailability } from '../../domain/entities/DeveloperAvailability';
import { LocalStorageSprintRepository } from '../../infrastructure/repositories/LocalStorageSprintRepository';
import { LocalStorageUserStoryRepository } from '../../infrastructure/repositories/LocalStorageUserStoryRepository';
import { LocalStorageProgressRepository } from '../../infrastructure/repositories/LocalStorageProgressRepository';
import { LocalStorageDeveloperRepository } from '../../infrastructure/repositories/LocalStorageDeveloperRepository';
import { LocalStorageHolidayRepository } from '../../infrastructure/repositories/LocalStorageHolidayRepository';
import { LocalStorageAvailabilityRepository } from '../../infrastructure/repositories/LocalStorageAvailabilityRepository';
import { CreateSprintUseCase } from '../../application/use-cases/sprint/CreateSprintUseCase';
import { UpdateSprintUseCase } from '../../application/use-cases/sprint/UpdateSprintUseCase';
import { CreateStoryUseCase } from '../../application/use-cases/story/CreateStoryUseCase';
import { UpdateStoryUseCase } from '../../application/use-cases/story/UpdateStoryUseCase';
import { AddProgressUseCase } from '../../application/use-cases/story/AddProgressUseCase';
import type { CreateSprintInput } from '../../application/use-cases/sprint/CreateSprintUseCase';
import type { UpdateSprintInput } from '../../application/use-cases/sprint/UpdateSprintUseCase';
import type { CreateStoryInput } from '../../application/use-cases/story/CreateStoryUseCase';
import type { UpdateStoryInput } from '../../application/use-cases/story/UpdateStoryUseCase';
import type { AddProgressInput } from '../../application/use-cases/story/AddProgressUseCase';
import {
  MOCK_SPRINTS,
  MOCK_STORIES,
  MOCK_PROGRESS_RECORDS,
  MOCK_DEVELOPERS,
  MOCK_HOLIDAYS,
  MOCK_AVAILABILITY,
} from '../../mockData';

// Repositories (singletons)
const sprintRepo = new LocalStorageSprintRepository();
const storyRepo = new LocalStorageUserStoryRepository();
const progressRepo = new LocalStorageProgressRepository();
const developerRepo = new LocalStorageDeveloperRepository();
const holidayRepo = new LocalStorageHolidayRepository();
const availabilityRepo = new LocalStorageAvailabilityRepository();

interface AppState {
  sprints: Sprint[];
  stories: UserStory[];
  progressRecords: ProgressRecord[];
  developers: Developer[];
  holidays: SprintHoliday[];
  availability: DeveloperAvailability[];
  selectedSprintId: string | null;
  isLoading: boolean;
  error: string | null;

  initialize: () => Promise<void>;

  // Sprint actions
  createSprint: (input: CreateSprintInput) => Promise<Sprint>;
  updateSprint: (input: UpdateSprintInput) => Promise<Sprint>;
  deleteSprint: (id: string) => Promise<void>;
  setSelectedSprint: (id: string | null) => void;

  // Story actions
  createStory: (input: CreateStoryInput) => Promise<UserStory>;
  updateStory: (input: UpdateStoryInput) => Promise<UserStory>;
  deleteStory: (id: string) => Promise<void>;

  // Progress actions
  addProgress: (input: AddProgressInput) => Promise<ProgressRecord>;

  // Developer actions
  saveDeveloper: (developer: Developer) => Promise<void>;
  updateDeveloper: (developer: Developer) => Promise<void>;
  deleteDeveloper: (id: string) => Promise<void>;

  // Holiday actions
  addHoliday: (holiday: SprintHoliday) => Promise<void>;
  removeHoliday: (id: string) => Promise<void>;

  // Availability actions
  saveAvailability: (record: DeveloperAvailability) => Promise<void>;
  updateAvailability: (record: DeveloperAvailability) => Promise<void>;
  removeAvailability: (id: string) => Promise<void>;

  // Backup/Restore
  restoreData: (data: {
    sprints: Sprint[];
    stories: UserStory[];
    progressRecords: ProgressRecord[];
    developers: Developer[];
    holidays?: SprintHoliday[];
    availability?: DeveloperAvailability[];
  }) => Promise<void>;

  // Selectors
  getActiveSprint: () => Sprint | null;
  getStoriesBySprint: (sprintId: string) => UserStory[];
  getProgressByStory: (storyId: string) => ProgressRecord[];
  getHolidaysBySprint: (sprintId: string) => SprintHoliday[];
  getAvailabilityBySprint: (sprintId: string) => DeveloperAvailability[];
}

export const useAppStore = create<AppState>()(
  (set, get) => ({
    sprints: [],
    stories: [],
    progressRecords: [],
    developers: [],
    holidays: [],
    availability: [],
    selectedSprintId: null,
    isLoading: false,
    error: null,

    initialize: async () => {
      set({ isLoading: true, error: null });
      try {
        const [sprints, stories, progressRecords, developers, holidays, availability] =
          await Promise.all([
            sprintRepo.getAll(),
            storyRepo.getAll(),
            progressRepo.getAll(),
            developerRepo.getAll(),
            holidayRepo.getAll(),
            availabilityRepo.getAll(),
          ]);

        if (sprints.length === 0 && developers.length === 0) {
          await Promise.all([
            (sprintRepo as LocalStorageSprintRepository).saveAll(MOCK_SPRINTS),
            (storyRepo as LocalStorageUserStoryRepository).saveAll(MOCK_STORIES),
            (progressRepo as LocalStorageProgressRepository).saveAll(MOCK_PROGRESS_RECORDS),
            (developerRepo as LocalStorageDeveloperRepository).saveAll(MOCK_DEVELOPERS),
            holidayRepo.saveAll(MOCK_HOLIDAYS),
            availabilityRepo.saveAll(MOCK_AVAILABILITY),
          ]);

          const activeSprint = MOCK_SPRINTS.find((s) => s.status === 'active');
          set({
            sprints: MOCK_SPRINTS,
            stories: MOCK_STORIES,
            progressRecords: MOCK_PROGRESS_RECORDS,
            developers: MOCK_DEVELOPERS,
            holidays: MOCK_HOLIDAYS,
            availability: MOCK_AVAILABILITY,
            selectedSprintId: activeSprint?.id ?? null,
            isLoading: false,
          });
        } else {
          const activeSprint = sprints.find((s) => s.status === 'active');
          set({
            sprints,
            stories,
            progressRecords,
            developers,
            holidays,
            availability,
            selectedSprintId: activeSprint?.id ?? sprints[0]?.id ?? null,
            isLoading: false,
          });
        }
      } catch (err) {
        set({ error: String(err), isLoading: false });
      }
    },

    createSprint: async (input) => {
      const useCase = new CreateSprintUseCase(sprintRepo);
      const sprint = await useCase.execute(input);
      set((state) => ({ sprints: [...state.sprints, sprint] }));
      return sprint;
    },

    updateSprint: async (input) => {
      const useCase = new UpdateSprintUseCase(sprintRepo);
      const sprint = await useCase.execute(input);
      set((state) => ({
        sprints: state.sprints.map((s) => (s.id === sprint.id ? sprint : s)),
      }));
      return sprint;
    },

    deleteSprint: async (id) => {
      await sprintRepo.delete(id);
      // Limpiar feriados y disponibilidad del sprint eliminado
      const { holidays, availability } = get();
      const newHolidays = holidays.filter((h) => h.sprintId !== id);
      const newAvailability = availability.filter((a) => a.sprintId !== id);
      await holidayRepo.saveAll(newHolidays);
      await availabilityRepo.saveAll(newAvailability);
      set((state) => ({
        sprints: state.sprints.filter((s) => s.id !== id),
        stories: state.stories.filter((s) => s.sprintId !== id),
        holidays: newHolidays,
        availability: newAvailability,
        selectedSprintId: state.selectedSprintId === id ? null : state.selectedSprintId,
      }));
    },

    setSelectedSprint: (id) => set({ selectedSprintId: id }),

    createStory: async (input) => {
      const useCase = new CreateStoryUseCase(storyRepo);
      const story = await useCase.execute(input);
      set((state) => ({ stories: [...state.stories, story] }));
      return story;
    },

    updateStory: async (input) => {
      const useCase = new UpdateStoryUseCase(storyRepo);
      const story = await useCase.execute(input);
      set((state) => ({
        stories: state.stories.map((s) => (s.id === story.id ? story : s)),
      }));
      return story;
    },

    deleteStory: async (id) => {
      await storyRepo.delete(id);
      set((state) => ({
        stories: state.stories.filter((s) => s.id !== id),
        progressRecords: state.progressRecords.filter((p) => p.storyId !== id),
      }));
    },

    addProgress: async (input) => {
      const useCase = new AddProgressUseCase(progressRepo, storyRepo);
      const record = await useCase.execute(input);
      const updatedStory = await storyRepo.getById(input.storyId);
      set((state) => ({
        progressRecords: [...state.progressRecords, record],
        stories: updatedStory
          ? state.stories.map((s) => (s.id === updatedStory.id ? updatedStory : s))
          : state.stories,
      }));
      return record;
    },

    saveDeveloper: async (developer) => {
      await developerRepo.save(developer);
      set((state) => ({ developers: [...state.developers, developer] }));
    },

    updateDeveloper: async (developer) => {
      await developerRepo.update(developer);
      set((state) => ({
        developers: state.developers.map((d) => (d.id === developer.id ? developer : d)),
      }));
    },

    deleteDeveloper: async (id) => {
      await developerRepo.delete(id);
      set((state) => ({
        developers: state.developers.filter((d) => d.id !== id),
      }));
    },

    addHoliday: async (holiday) => {
      await holidayRepo.save(holiday);
      set((state) => ({ holidays: [...state.holidays, holiday] }));
    },

    removeHoliday: async (id) => {
      await holidayRepo.delete(id);
      set((state) => ({ holidays: state.holidays.filter((h) => h.id !== id) }));
    },

    saveAvailability: async (record) => {
      await availabilityRepo.save(record);
      set((state) => ({ availability: [...state.availability, record] }));
    },

    updateAvailability: async (record) => {
      await availabilityRepo.update(record);
      set((state) => ({
        availability: state.availability.map((a) => (a.id === record.id ? record : a)),
      }));
    },

    removeAvailability: async (id) => {
      await availabilityRepo.delete(id);
      set((state) => ({ availability: state.availability.filter((a) => a.id !== id) }));
    },

    restoreData: async (data) => {
      await Promise.all([
        (sprintRepo as LocalStorageSprintRepository).saveAll(data.sprints),
        (storyRepo as LocalStorageUserStoryRepository).saveAll(data.stories),
        (progressRepo as LocalStorageProgressRepository).saveAll(data.progressRecords),
        (developerRepo as LocalStorageDeveloperRepository).saveAll(data.developers),
        holidayRepo.saveAll(data.holidays ?? []),
        availabilityRepo.saveAll(data.availability ?? []),
      ]);
      const activeSprint = data.sprints.find((s) => s.status === 'active');
      set({
        sprints: data.sprints,
        stories: data.stories,
        progressRecords: data.progressRecords,
        developers: data.developers,
        holidays: data.holidays ?? [],
        availability: data.availability ?? [],
        selectedSprintId: activeSprint?.id ?? data.sprints[0]?.id ?? null,
      });
    },

    getActiveSprint: () => get().sprints.find((s) => s.status === 'active') ?? null,
    getStoriesBySprint: (sprintId) => get().stories.filter((s) => s.sprintId === sprintId),
    getProgressByStory: (storyId) => get().progressRecords.filter((p) => p.storyId === storyId),
    getHolidaysBySprint: (sprintId) => get().holidays.filter((h) => h.sprintId === sprintId),
    getAvailabilityBySprint: (sprintId) => get().availability.filter((a) => a.sprintId === sprintId),
  })
);
