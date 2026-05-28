import React, { useCallback } from 'react';
import { useUiStore } from '@/shared/store/uiStore';
import { useDocumentStore } from '@/features/documents/store';
import { useShallow } from 'zustand/react/shallow';
import { cn } from '@/shared/lib/utils';
import { X, FileText, Book, User } from '@phosphor-icons/react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableTab = ({ tabId, paneId, isActive }: { tabId: string, paneId: string, isActive: boolean }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: tabId });
  const { setActiveTab, closeDocument } = useUiStore(
    useShallow((state) => ({
      setActiveTab: state.setActiveTab,
      closeDocument: state.closeDocument,
    }))
  );

  // Target-selected document title and type to prevent any keystroke/typing re-renders!
  const docSelector = useCallback(
    state => {
      if (tabId === 'new-note') return { title: 'Untitled', type: 'page' };
      const d = state.documents[tabId];
      return d ? { title: d.title, type: d.type } : null;
    },
    [tabId]
  );
  const doc = useDocumentStore(useShallow(docSelector));

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (!doc) return null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        // Only trigger if not dragging
        if (!e.defaultPrevented) {
          e.stopPropagation();
          setActiveTab(tabId, paneId);
        }
      }}
      className={cn(
        "flex items-center h-full px-4 border-r border-border min-w-[120px] max-w-[200px] gap-2 cursor-pointer transition-colors group",
        isActive
          ? "bg-muted text-foreground border-t-2 border-t-accent"
          : "text-muted-foreground hover:bg-muted/50 border-t-2 border-t-transparent"
      )}
    >
      <span className="shrink-0 text-muted-foreground">
        {getIcon(doc.type)}
      </span>
      <span className="text-xs truncate flex-1">{doc.title}</span>
      <button
        onPointerDown={(e) => {
          e.stopPropagation();
          closeDocument(tabId, paneId);
        }}
        className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-border transition-colors text-muted-foreground z-10"
      >
        <X size={12} />
      </button>
    </div>
  );
};

export const TabBar = ({ paneId }: { paneId: string }) => {
  const { panes, activePaneId, setActivePane } = useUiStore(
    useShallow((state) => ({
      panes: state.panes,
      activePaneId: state.activePaneId,
      setActivePane: state.setActivePane,
    }))
  );

  const pane = panes.find(p => p?.id === paneId);
  if (!pane) return null;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id && over) {
      // Reorder tabs in the store
      const oldIndex = pane.tabs.indexOf(active.id as string);
      const newIndex = pane.tabs.indexOf(over.id as string);
      if (oldIndex !== -1 && newIndex !== -1) {
        useUiStore.setState((state) => {
          const newPanes = state.panes.map(p => {
            if (p?.id === paneId) {
              return { ...p, tabs: arrayMove(p.tabs, oldIndex, newIndex) };
            }
            return p;
          });
          return { panes: newPanes };
        });
      }
    }
  };

  return (
    <div
      className={cn(
        "flex items-center h-10 border-b border-border bg-background overflow-x-auto overflow-y-hidden select-none",
        activePaneId === paneId ? "opacity-100" : "opacity-70 grayscale hover:grayscale-0"
      )}
      onClick={() => setActivePane(paneId)}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={pane.tabs}
          strategy={horizontalListSortingStrategy}
        >
          {pane.tabs.map(tabId => {
            const isActive = pane.activeTabId === tabId;
            return (
              <SortableTab
                key={tabId}
                tabId={tabId}
                paneId={paneId}
                isActive={isActive}
              />
            );
          })}
        </SortableContext>
      </DndContext>
    </div>
  );
};

function getIcon(type: string) {
  switch (type) {
    case 'page': return <FileText size={14} />;
    case 'book': return <Book size={14} />;
    case 'person': return <User size={14} />;
    default: return <FileText size={14} />;
  }
}
