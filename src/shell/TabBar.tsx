import { useDocumentStore } from '@/features/documents/store';
import { useCollectionStore } from '@/features/collections/store/collectionStore';
import { useSettingsStore } from '@/features/settings/store';
import { cn } from '@/shared/lib/utils';
import { useUiStore } from '@/shared/store/uiStore';
import {
	closestCenter,
	DndContext,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	type DragEndEvent,
} from '@dnd-kit/core';
import {
	arrayMove,
	horizontalListSortingStrategy,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Book,CalendarBlank,CheckSquare,Eye,FileText,Folder,Gear,Sparkle,SquaresFour,Star,Tag,Trash,User,X } from '@phosphor-icons/react';
import React from 'react';
import { useShallow } from 'zustand/react/shallow';

function getContrastColor(backgroundColor?: string): string {
  if (!backgroundColor) return 'var(--foreground)';
  
  const clean = backgroundColor.toLowerCase().trim();
  
  // Check if it's a gradient
  if (clean.includes('gradient')) {
    if (
      clean.includes('#09090b') || clean.includes('#18181b') ||
      clean.includes('#1c1c1e') || clean.includes('#0f172a') ||
      clean.includes('#1a1740') || clean.includes('#121214') ||
      clean.includes('#1e293b') || clean.includes('#1f1b40') ||
      clean.includes('#0b2e24') || clean.includes('#041410') ||
      clean.includes('#300f4f') || clean.includes('#18052b') ||
      clean.includes('#420d0d') || clean.includes('#1f0404') ||
      clean.includes('#07241c') || clean.includes('#24053e') ||
      clean.includes('#2d0505')
    ) {
      return '#ffffff';
    }
    return '#111827';
  }
  
  if (clean.startsWith('#')) {
    const hex = clean.substring(1);
    if (hex.length === 3 || hex.length === 6) {
      const r = parseInt(hex.length === 3 ? hex[0] + hex[0] : hex.substring(0, 2), 16);
      const g = parseInt(hex.length === 3 ? hex[1] + hex[1] : hex.substring(2, 4), 16);
      const b = parseInt(hex.length === 3 ? hex[2] + hex[2] : hex.substring(4, 6), 16);
      const brightness = Math.sqrt(0.299 * r * r + 0.587 * g * g + 0.114 * b * b);
      return brightness < 130 ? '#ffffff' : '#111827';
    }
  }
  
  if (clean.startsWith('rgb')) {
    const match = clean.match(/\d+/g);
    if (match && match.length >= 3) {
      const r = parseInt(match[0], 10);
      const g = parseInt(match[1], 10);
      const b = parseInt(match[2], 10);
      const brightness = Math.sqrt(0.299 * r * r + 0.587 * g * g + 0.114 * b * b);
      return brightness < 130 ? '#ffffff' : '#111827';
    }
  }
  
  return 'var(--foreground)';
}

function getSectionColor(tabId: string, type: string, folderColor?: string): string | undefined {
  if (tabId.startsWith('section-folder-')) return folderColor;
  if (tabId === 'section-daily-notes') return '#10b981'; // Emerald
  if (tabId === 'section-tasks') return '#3b82f6'; // Blue
  if (tabId === 'section-tags') return '#f59e0b'; // Amber
  if (tabId === 'section-ask-ai') return '#a855f7'; // Purple/AI Accent
  if (tabId === 'section-glance') return '#6366f1'; // Indigo
  if (tabId === 'section-wall') return '#ec4899'; // Pink
  if (tabId === 'section-help') return '#14b8a6'; // Teal
  if (tabId === 'section-favorites') return '#eab308'; // Yellow/Gold
  if (tabId === 'section-folders') return '#8b5cf6'; // Purple
  if (tabId === 'section-uncategorized') return '#64748b'; // Slate
  if (tabId === 'section-trash') return '#ef4444'; // Red
  if (tabId === 'section-settings') return '#64748b'; // Slate
  return undefined;
}

const SortableTab = ({ tabId, paneId, isActive }: { tabId: string, paneId: string, isActive: boolean }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: tabId });
  const { setActiveTab, closeDocument } = useUiStore(
    useShallow((state) => ({
      setActiveTab: state.setActiveTab,
      closeDocument: state.closeDocument,
    }))
  );

  // Target-selected document title and type to prevent any keystroke/typing re-renders!
  const docSelector = React.useCallback(
    (state: any) => {
      if (tabId === 'new-note') return { title: 'Untitled', type: 'page', icon: undefined };
      if (tabId === 'section-daily-notes') return { title: 'Daily Notes', type: 'daily-notes', icon: undefined };
      if (tabId === 'section-tasks') return { title: 'Tasks', type: 'tasks', icon: undefined };
      if (tabId === 'section-tags') return { title: 'Tags', type: 'tags', icon: undefined };
      if (tabId === 'section-collections') return { title: 'Collections', type: 'collections', icon: undefined };
      if (tabId === 'section-ask-ai') return { title: 'Ask AI', type: 'ask-ai', icon: undefined };
      if (tabId === 'section-glance') return { title: 'Glance', type: 'glance', icon: undefined };
      if (tabId === 'section-wall') return { title: 'Wall', type: 'wall', icon: undefined };
      if (tabId === 'section-help') return { title: 'Help', type: 'help', icon: undefined };
      if (tabId === 'section-favorites') return { title: 'Favorites', type: 'favorites', icon: undefined };
      if (tabId === 'section-folders') return { title: 'Folders', type: 'folders', icon: undefined };
      if (tabId === 'section-uncategorized') return { title: 'Uncategorized', type: 'folders', icon: undefined };
      if (tabId === 'section-trash') return { title: 'Trash', type: 'trash', icon: undefined };
      if (tabId === 'section-settings') return { title: 'Settings', type: 'settings', icon: undefined };
      if (tabId.startsWith('section-collection-')) {
        return { title: 'Collection', type: 'collection', icon: '📚' };
      }
      if (tabId.startsWith('section-folder-')) {
        const folderId = tabId.replace('section-folder-', '');
        const folder = state.folders?.find((f: any) => f?.id === folderId);
        const folderColor = state.folderColors?.[folderId] || undefined;
        return { title: folder?.name || 'Folder', type: 'folder', icon: undefined, folderColor };
      }
      if (tabId.startsWith('section-')) {
        const cleanId = tabId.replace('section-', '');
        const title = cleanId.charAt(0).toUpperCase() + cleanId.slice(1);
        return { title, type: cleanId, icon: undefined };
      }
      const d = state.documents[tabId];
      if (d) {
        const folderColor = d.folderId ? (state.folderColors?.[d.folderId] || undefined) : undefined;
        return {
          title: d.title,
          type: d.type,
          icon: d.icon,
          cardColor: d.cardColor,
          textColor: d.textColor,
          backdropColor: d.backdropColor,
          color: d.color,
          isDeleted: d.isDeleted,
          folderColor,
        };
      }
      return null;
    },
    [tabId]
  );
  const doc = useDocumentStore(useShallow(docSelector));

  const isCollection = tabId.startsWith('section-collection-');
  const collectionId = isCollection ? tabId.replace('section-collection-', '') : '';
  const colName = useCollectionStore(state => isCollection ? state.collections[collectionId]?.name : '');
  const colIcon = useCollectionStore(state => isCollection ? state.collections[collectionId]?.icon : '');
  const colColor = useCollectionStore(state => isCollection ? state.collections[collectionId]?.color : '');

  const displayTitle = isCollection ? (colName || 'Collection') : (doc?.title || '');
  const displayIcon = isCollection ? (colIcon || '📚') : doc?.icon;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const sectionColor = React.useMemo(() => {
    if (!doc) return undefined;
    if (isCollection) return colColor;
    return getSectionColor(tabId, doc.type, (doc as any).folderColor);
  }, [tabId, doc, isCollection, colColor]);

  // Decide the base color for the icon
  const resolvedIconColor = React.useMemo(() => {
    if (!doc) return undefined;
    if (isCollection) return colColor;
    return (doc as any).cardColor || sectionColor || (doc as any).folderColor || (doc as any).color;
  }, [doc, sectionColor, isCollection, colColor]);

  const iconStyle = React.useMemo(() => resolvedIconColor ? { color: resolvedIconColor } : undefined, [resolvedIconColor]);

  // Dynamic tab background and border styling
  const bgStyleValue = React.useMemo(() => {
    if (!doc) return undefined;
    if (isCollection) return colColor;
    return (doc as any).cardColor || sectionColor || (doc as any).folderColor;
  }, [doc, sectionColor, isCollection, colColor]);
  
  const hasBgColor = !!bgStyleValue;

  const bgOpacityClass = React.useMemo(() => {
    if (!doc) return "opacity-0";
    if (isActive) {
      if (isCollection) return "opacity-20";
      if ((doc as any).cardColor || sectionColor || (doc as any).folderColor) return "opacity-20";
      return "opacity-0";
    } else {
      if (isCollection) return "opacity-8 group-hover:opacity-18";
      if ((doc as any).cardColor || sectionColor || (doc as any).folderColor) return "opacity-8 group-hover:opacity-18";
      return "opacity-0";
    }
  }, [isActive, doc, sectionColor, isCollection]);

  const topBorderColor = React.useMemo(() => {
    if (isActive) {
      return resolvedIconColor || 'var(--accent)';
    }
    return 'transparent';
  }, [isActive, resolvedIconColor]);

  const contrastColor = undefined;

  const textStyle = React.useMemo(() => contrastColor ? { color: contrastColor } : undefined, [contrastColor]);

  const closeBtnClassName = React.useMemo(() => {
    if (!doc) return "";
    return cn(
      "opacity-0 group-hover:opacity-100 p-0.5 rounded-sm transition-colors z-10",
      "hover:bg-border text-muted-foreground"
    );
  }, [doc]);

  if (!doc) return null;

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        ...textStyle
      }}
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
        "relative flex items-center h-full px-4 border-r border-border min-w-[120px] max-w-[200px] gap-2 cursor-pointer transition-all group overflow-hidden select-none",
        isActive
          ? "bg-muted text-foreground"
          : "text-muted-foreground hover:bg-muted/50"
      )}
    >
      {/* Dynamic Background Layer */}
      {hasBgColor && (
        <div 
          className={cn(
            "absolute inset-0 -z-10 transition-opacity duration-200",
            bgOpacityClass
          )}
          style={{ background: bgStyleValue }}
        />
      )}
      
      {/* Top Accent Border */}
      <div 
        className="absolute top-0 left-0 right-0 h-[2px] transition-colors duration-200"
        style={{ backgroundColor: topBorderColor }} 
      />

      <span 
        className="shrink-0 transition-colors flex items-center justify-center"
        style={iconStyle}
      >
        {getIcon(isCollection ? 'collection' : doc.type, displayIcon)}
      </span>
      
      {doc.isDeleted && (
        <Trash size={12} className="text-red-500 shrink-0" weight="fill" />
      )}
      <span className="text-xs truncate flex-1 font-medium">{displayTitle}</span>
      
      <button
        onPointerDown={(e) => {
          e.stopPropagation();
          closeDocument(tabId, paneId);
        }}
        className={closeBtnClassName}
      >
        <X size={12} />
      </button>
    </div>
  );
};

export const TabBar = ({ paneId }: { paneId: string }) => {
  const { panes, activePaneId, setActivePane, removePane } = useUiStore(
    useShallow((state) => ({
      panes: state.panes,
      activePaneId: state.activePaneId,
      setActivePane: state.setActivePane,
      removePane: state.removePane,
    }))
  );

  const { 
    activeHighlightType, 
    activeHighlightColor, 
    activeHighlightGradient,
    inactiveHighlightType,
    inactiveHighlightColor,
    inactiveHighlightGradient,
    grayscaleInactiveTabs = true
  } = useSettingsStore();

  const pane = panes.find(p => p?.id === paneId);

  const isCurrentActive = activePaneId === paneId;

  const highlightStyle = React.useMemo(() => {
    if (isCurrentActive) {
      return {
        background: activeHighlightType === 'gradient' ? activeHighlightGradient : activeHighlightColor,
      };
    } else {
      const bg = inactiveHighlightType === 'gradient' ? inactiveHighlightGradient : inactiveHighlightColor;
      return bg && bg !== 'none' && bg !== 'transparent' ? { background: bg } : undefined;
    }
  }, [
    isCurrentActive, 
    activeHighlightType, 
    activeHighlightColor, 
    activeHighlightGradient,
    inactiveHighlightType,
    inactiveHighlightColor,
    inactiveHighlightGradient
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (!pane) return null;

  const uniqueTabs = React.useMemo(() => {
    return pane.tabs.filter((tabId, index, self) => !!tabId && self.indexOf(tabId) === index);
  }, [pane.tabs]);

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
    <div className="relative">
      <div
        id="onboarding-tab-bar"
        data-onboarding-tab-bar={paneId}
        className={cn(
          "flex items-center h-10 border-b border-border bg-background overflow-x-auto overflow-y-hidden select-none justify-between relative",
          activePaneId === paneId 
            ? "opacity-100" 
            : cn("opacity-100", grayscaleInactiveTabs && "grayscale hover:grayscale-0")
        )}
        onClick={() => setActivePane(paneId)}
      >
        <div className="flex items-center overflow-x-auto overflow-y-hidden flex-1 no-scrollbar h-full">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={uniqueTabs}
              strategy={horizontalListSortingStrategy}
            >
              {uniqueTabs.map(tabId => {
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

        {panes.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              removePane(paneId);
            }}
            className="shrink-0 p-1.5 mr-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded transition-all flex items-center justify-center cursor-pointer"
            title="Close this pane"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Highlight bar rendered OUTSIDE the grayscale-filtered wrapper so its colour is never desaturated */}
      {highlightStyle && (
        <div
          style={highlightStyle}
          className="absolute bottom-0 left-0 right-0 h-[2px] z-10 pointer-events-none"
        />
      )}
    </div>
  );
};


function getIcon(type: string, emoji?: string) {
  if (emoji) {
    return <span className="text-[13px] leading-none flex items-center justify-center font-sans">{emoji}</span>;
  }
  switch (type) {
    case 'page': return <FileText size={14} />;
    case 'book': return <Book size={14} />;
    case 'person': return <User size={14} />;
    case 'ask-ai': return <Sparkle size={14} />;
    case 'daily-notes': return <CalendarBlank size={14} />;
    case 'tasks': return <CheckSquare size={14} />;
    case 'tags': return <Tag size={14} />;
    case 'collections': return <SquaresFour size={14} />;
    case 'glance': return <Eye size={14} />;
    case 'wall': return <SquaresFour size={14} />;
    case 'folders':
    case 'folder':
      return <Folder size={14} />;
    case 'favorites': return <Star size={14} />;
    case 'trash': return <Trash size={14} />;
    case 'settings': return <Gear size={14} />;
    default: return <FileText size={14} />;
  }
}
