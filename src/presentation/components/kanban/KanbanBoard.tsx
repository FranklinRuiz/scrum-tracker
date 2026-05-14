import React, { useState, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCorners,
} from '@dnd-kit/core';
import type { UserStory } from '../../../domain/entities/UserStory';
import type { Developer } from '../../../domain/entities/Developer';
import type { StoryStatus } from '../../../domain/value-objects/StoryStatus';
import { STORY_STATUS_ORDER } from '../../../domain/value-objects/StoryStatus';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';

interface KanbanBoardProps {
  stories: UserStory[];
  developers: Developer[];
  onStatusChange: (storyId: string, newStatus: StoryStatus) => Promise<void>;
  onCardClick: (story: UserStory) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  stories,
  developers,
  onStatusChange,
  onCardClick,
}) => {
  const [activeStory, setActiveStory] = useState<UserStory | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const getStoriesByStatus = useCallback(
    (status: StoryStatus) => stories.filter((s) => s.status === status),
    [stories]
  );

  const handleDragStart = (event: DragStartEvent) => {
    const story = stories.find((s) => s.id === event.active.id);
    setActiveStory(story ?? null);
  };

  const handleDragOver = (_event: DragOverEvent) => {
    // Handled in handleDragEnd
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveStory(null);

    if (!over) return;

    const storyId = active.id as string;
    const overId = over.id as string;

    // Determine target status
    let targetStatus: StoryStatus | undefined;

    // Check if over a column (status id)
    if (STORY_STATUS_ORDER.includes(overId as StoryStatus)) {
      targetStatus = overId as StoryStatus;
    } else {
      // Over a card — use that card's status
      const targetStory = stories.find((s) => s.id === overId);
      if (targetStory) targetStatus = targetStory.status;
    }

    if (!targetStatus) return;

    const story = stories.find((s) => s.id === storyId);
    if (!story || story.status === targetStatus) return;

    await onStatusChange(storyId, targetStatus);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 h-full min-h-0">
        {STORY_STATUS_ORDER.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            stories={getStoriesByStatus(status)}
            developers={developers}
            onCardClick={onCardClick}
          />
        ))}
      </div>

      <DragOverlay>
        {activeStory && (
          <div className="rotate-2 opacity-90 shadow-2xl">
            <KanbanCard
              story={activeStory}
              developers={developers}
              onClick={() => {}}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};
