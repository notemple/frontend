
import { cn } from '@/shared/lib/utils';
import { useDroppable } from '@dnd-kit/core';
import { type Task } from '../store';
import { KanbanCard } from './KanbanCard';

export const KanbanColumn = ({
  status,
  title,
  tasks,
  icon: Icon,
  colorClass,
  badgeClass,
  updateTask,
  deleteTask,
  onOpenTask,
  onDatePickerOpenChange,
  openDatePickerTaskId,
}: {
  status: "open" | "in progress" | "done";
  title: string;
  tasks: Task[];
  icon: any;
  colorClass: string;
  badgeClass: string;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  onOpenTask: (id: string) => void;
  onDatePickerOpenChange: (isOpen: boolean, id: string) => void;
  openDatePickerTaskId: string | null;
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col flex-1 min-w-[280px] bg-card/45 dark:bg-muted/15 border border-border/80 rounded-sm-sm p-4 transition-all duration-150 relative min-h-[500px] select-none",
        isOver && "bg-muted/20 border-purple-500/30 scale-[1.01] shadow-sm-sm"
      )}
    >
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-border/60">
        <div className="flex items-center gap-2">
          <span className={colorClass}>
            <Icon size={16} weight="bold" />
          </span>
          <span className="font-sans font-bold text-sm text-foreground">{title}</span>
        </div>
        <span className={cn("text-[10px] font-mono font-bold px-2 py-0.5 rounded-sm-full border", badgeClass)}>
          {tasks.length}
        </span>
      </div>

      <div className="flex flex-col gap-3 flex-1 overflow-y-auto no-scrollbar max-h-[calc(100vh-280px)] pr-0.5">
        {tasks.map((task) => (
          <KanbanCard
            key={task.id}
            task={task}
            updateTask={updateTask}
            deleteTask={deleteTask}
            onOpen={() => onOpenTask(task.id)}
            onDatePickerOpenChange={(isOpen) => onDatePickerOpenChange(isOpen, task.id)}
            isDatePickerOpen={openDatePickerTaskId === task.id}
          />
        ))}
        
        {tasks.length === 0 && (
          <div className="flex-1 flex items-center justify-center border-2 border-dashed border-border/40 rounded-sm-sm p-6 min-h-[120px] transition-colors duration-150">
            <span className="text-xs text-muted-foreground/60 italic font-medium font-sans">
              Drop tasks here
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
