import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useMemo } from 'react';
import { useDocumentStore } from '@/features/documents/store';
import { useUiStore } from '@/shared/store/uiStore';
import { useShallow } from 'zustand/react/shallow';
import { useTaskStore } from '@/features/tasks/store';
import { 
  FileText, 
  Calendar, 
  CheckSquare, 
  Square,
  Tag as TagIcon, 
  User, 
  PlusCircle 
} from '@phosphor-icons/react';
import { format, addDays } from 'date-fns';

interface MentionListProps {
  query: string;
  editor: any;
  range: any;
}

interface MentionItem {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  group: 'Documents' | 'Dates' | 'Tasks' | 'Tags' | 'People';
  action: () => void;
}

export const MentionList = forwardRef((props: MentionListProps, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Live lookup of documents, tags, and tasks from the store
  const documents = useDocumentStore(state => state.documents);
  const createdTags = useDocumentStore(state => state.createdTags) || [];
  const tasks = useTaskStore(state => state.tasks) || [];

  const items = useMemo(() => {
    const list: MentionItem[] = [];
    const query = props.query.toLowerCase().trim();

    // 1. Documents Group
    const docs = Object.values(documents)
      .filter((doc: any) => doc && !doc.isDeleted)
      .filter((doc: any) => !query || (doc.title || 'Untitled').toLowerCase().includes(query))
      .slice(0, 5)
      .map((doc: any) => ({
        title: doc.title || 'Untitled',
        subtitle: 'Note',
        icon: doc.icon ? (
          <span className="text-[14px] leading-none flex items-center justify-center font-sans shrink-0">{doc.icon}</span>
        ) : (
          <FileText size={16} className="text-blue-500" />
        ),
        group: 'Documents' as const,
        action: () => {
          props.editor
            .chain()
            .focus()
            .deleteRange(props.range)
            .insertContent({
              type: 'reference',
              attrs: { id: doc.id, label: doc.title || 'Untitled', type: 'document' }
            })
            .insertContent(' ')
            .run();
        }
      }));
    list.push(...docs);

    // 2. Dates Group
    const today = new Date();
    const dateOptions = [
      { label: 'Today', date: today },
      { label: 'Tomorrow', date: addDays(today, 1) },
      { label: 'Next Week', date: addDays(today, 7) }
    ];
    const filteredDates = dateOptions
      .filter(d => !query || d.label.toLowerCase().includes(query))
      .map(d => {
        const formatted = format(d.date, 'eeee, MMM d, yyyy');
        return {
          title: d.label,
          subtitle: formatted,
          icon: <Calendar size={16} className="text-purple-500" />,
          group: 'Dates' as const,
          action: () => {
            props.editor
              .chain()
              .focus()
              .deleteRange(props.range)
              .insertContent({
                type: 'reference',
                attrs: { label: d.label, type: 'date', dateStr: formatted }
              })
              .insertContent(' ')
              .run();
          }
        };
      });
    list.push(...filteredDates);

    // 3. Tasks Group
    const filteredTasks = tasks
      .filter((task: any) => task && !task.isDeleted)
      .filter((task: any) => !query || (task.title || 'Untitled Task').toLowerCase().includes(query))
      .slice(0, 5)
      .map((task: any) => ({
        title: task.title || 'Untitled Task',
        subtitle: task.completed ? 'Completed' : 'Task',
        icon: (
          <span className="text-[14px] leading-none flex items-center justify-center font-sans shrink-0">
            {task.completed ? <CheckSquare size={16} className="text-emerald-500" /> : <Square size={16} className="text-amber-500" />}
          </span>
        ),
        group: 'Tasks' as const,
        action: () => {
          props.editor
            .chain()
            .focus()
            .deleteRange(props.range)
            .insertContent({
              type: 'reference',
              attrs: { id: task.id, label: task.title || 'Untitled Task', type: 'task', status: task.completed ? 'done' : 'todo' }
            })
            .insertContent(' ')
            .run();
        }
      }));
    list.push(...filteredTasks);

    if (query && !tasks.some(t => !t.isDeleted && t.title?.toLowerCase() === query)) {
      list.push({
        title: `Create task: "${props.query}"`,
        subtitle: 'Add as interactive check item',
        icon: <PlusCircle size={16} className="text-amber-500" />,
        group: 'Tasks' as const,
        action: () => {
          const newTaskId = `task-${crypto.randomUUID()}`;
          useTaskStore.getState().addTask({
            id: newTaskId,
            title: props.query,
            completed: false,
            status: 'open',
            list: 'All Tasks'
          });
          props.editor
            .chain()
            .focus()
            .deleteRange(props.range)
            .insertContent({
              type: 'reference',
              attrs: { id: newTaskId, label: props.query, type: 'task', status: 'todo' }
            })
            .insertContent(' ')
            .run();
        }
      });
    }

    // 4. Tags Group
    const uniqueTags = Array.from(new Set([
      ...createdTags,
      ...Object.values(documents).flatMap((d: any) => d?.tags || [])
    ])).filter(Boolean);

    const filteredTags = uniqueTags
      .filter(tag => !query || tag.toLowerCase().includes(query))
      .slice(0, 3)
      .map(tag => ({
        title: tag,
        icon: <TagIcon size={16} className="text-rose-500" />,
        group: 'Tags' as const,
        action: () => {
          props.editor
            .chain()
            .focus()
            .deleteRange(props.range)
            .insertContent({
              type: 'reference',
              attrs: { label: tag, type: 'tag' }
            })
            .insertContent(' ')
            .run();
        }
      }));
    list.push(...filteredTags);

    return list;
  }, [props.query, documents, createdTags, tasks, props.editor, props.range]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  // Handle automatic scrolling when selection index changes
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const selectedButton = container.querySelector('[data-mention-item="true"]') as HTMLElement;

    if (selectedButton) {
      const containerHeight = container.clientHeight;
      const containerScrollTop = container.scrollTop;
      const buttonTop = selectedButton.offsetTop;
      const buttonHeight = selectedButton.offsetHeight;

      if (buttonTop < containerScrollTop) {
        container.scrollTop = buttonTop - 8; // add a little padding
      } else if (buttonTop + buttonHeight > containerScrollTop + containerHeight) {
        container.scrollTop = buttonTop + buttonHeight - containerHeight + 8;
      }
    }
  }, [selectedIndex, items]);

  const selectItem = (index: number) => {
    const item = items[index];
    if (item) {
      item.action();
    }
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((selectedIndex + items.length - 1) % items.length);
        return true;
      }

      if (event.key === 'ArrowDown') {
        setSelectedIndex((selectedIndex + 1) % items.length);
        return true;
      }

      if (event.key === 'Enter') {
        selectItem(selectedIndex);
        return true;
      }

      return false;
    },
  }));

  if (items.length === 0) {
    return (
      <div className="bg-card border border-white/5 rounded-sm-sm shadow-sm-sm p-3 text-xs text-white/40 font-sans text-center min-w-[240px]">
        No references found.
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      id="onboarding-mention-list"
      className="bg-card border border-white/5 rounded-sm-sm shadow-sm-sm p-2 flex flex-col gap-1 min-w-[280px] max-h-[380px] overflow-y-auto no-scrollbar font-sans"
    >
      {items.map((item, index) => {
        const isNewGroup = index === 0 || item.group !== items[index - 1].group;
        const isSelected = index === selectedIndex;

        return (
          <React.Fragment key={index}>
            {isNewGroup && (
              <div className="px-3 py-2 text-[11px] text-white/30 font-medium tracking-wider uppercase mt-1.5 first:mt-0">
                {item.group}
              </div>
            )}
            <button
              data-mention-item={isSelected}
              onClick={() => selectItem(index)}
              className={`
                w-full flex items-center justify-between px-3 py-2.5 text-[13px] rounded-sm-sm transition-all duration-200 group relative overflow-hidden text-left shrink-0
                ${isSelected ? 'text-white shadow-sm-sm' : 'text-white/60 hover:text-white/90'}
              `}
            >
              {isSelected && (
                <div className="absolute inset-0 bg-muted/40 shadow-sm-inner rounded-sm-sm" />
              )}
              <div className="flex items-center gap-3 relative z-10 w-full min-w-0">
                <span className={isSelected ? "text-white flex items-center justify-center w-5 h-5 shadow-sm-sm transform scale-110 transition-transform shrink-0" : "opacity-70 group-hover:opacity-100 flex items-center justify-center w-5 h-5 transition-transform group-hover:scale-105 shrink-0"}>
                  {item.icon}
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold tracking-tight shadow-sm-sm truncate leading-none mb-0.5">{item.title}</span>
                  {item.subtitle && (
                    <span className="text-[10px] text-white/40 truncate leading-none">{item.subtitle}</span>
                  )}
                </div>
              </div>
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
});

MentionList.displayName = 'MentionList';
