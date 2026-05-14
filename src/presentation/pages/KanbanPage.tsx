import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useAppStore } from '../store/useAppStore';
import { KanbanBoard } from '../components/kanban/KanbanBoard';
import { StoryDetail } from '../components/story/StoryDetail';
import { SprintSelector } from '../components/sprint/SprintSelector';
import { EmptyState } from '../components/common/EmptyState';
import { Kanban } from 'lucide-react';
import type { UserStory } from '../../domain/entities/UserStory';
import type { StoryStatus } from '../../domain/value-objects/StoryStatus';

export const KanbanPage: React.FC = () => {
  const { sprints, stories, progressRecords, developers, selectedSprintId, setSelectedSprint, updateStory, addProgress } =
    useAppStore();
  const [selectedStory, setSelectedStory] = useState<UserStory | null>(null);

  const currentStories = selectedSprintId
    ? stories.filter((s) => s.sprintId === selectedSprintId)
    : [];

  const handleStatusChange = async (storyId: string, newStatus: StoryStatus) => {
    try {
      await updateStory({ id: storyId, status: newStatus });
      toast.success(`Story moved to ${newStatus}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update story');
    }
  };

  const handleAddProgress = async (data: {
    storyId: string;
    developerId: string;
    hoursWorked: number;
    comment: string;
    progressPercentage: number;
    newStatus: StoryStatus;
    commitmentMet: boolean;
  }) => {
    try {
      await addProgress(data);
      toast.success('Progress added');
      // Update selected story from store
      const updated = stories.find((s) => s.id === data.storyId);
      if (updated) setSelectedStory(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add progress');
    }
  };

  const storyProgressRecords = selectedStory
    ? progressRecords.filter((p) => p.storyId === selectedStory.id)
    : [];

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center gap-4">
        <div className="w-72">
          <SprintSelector
            sprints={sprints}
            selectedId={selectedSprintId}
            onSelect={setSelectedSprint}
          />
        </div>
        {selectedSprintId && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {currentStories.length} stories
          </span>
        )}
      </div>

      {/* Board */}
      <div className="flex-1 overflow-hidden p-6">
        {!selectedSprintId ? (
          <EmptyState
            icon={<Kanban className="h-16 w-16" />}
            title="Select a Sprint"
            description="Choose a sprint from the dropdown to view its Kanban board."
          />
        ) : currentStories.length === 0 ? (
          <EmptyState
            icon={<Kanban className="h-16 w-16" />}
            title="No Stories"
            description="This sprint has no stories yet. Add stories from the Stories page."
          />
        ) : (
          <KanbanBoard
            stories={currentStories}
            developers={developers}
            onStatusChange={handleStatusChange}
            onCardClick={setSelectedStory}
          />
        )}
      </div>

      {/* Story detail panel */}
      {selectedStory && (
        <StoryDetail
          story={selectedStory}
          developers={developers}
          progressRecords={storyProgressRecords}
          onClose={() => setSelectedStory(null)}
          onAddProgress={handleAddProgress}
          onEdit={() => setSelectedStory(null)}
        />
      )}
    </div>
  );
};
