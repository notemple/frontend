import type {
  EditorConfig,
  LexicalEditor,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from "lexical"
import { DecoratorNode, $applyNodeReplacement, $getNodeByKey } from "lexical"
import type { ReactNode } from "react"
import React, { useState, useEffect } from "react"
import { useTaskStore } from "@/features/tasks/store"
import { useTaskTimerStore } from "@/shared/store/taskTimerStore"
import { cn } from "@/shared/lib/utils"
import { CustomStatusPicker } from "@/features/tasks/TasksPage"
import { CustomDatePicker } from "@/features/tasks/components/CustomDatePicker"
import { CustomPriorityPicker } from "@/features/tasks/components/CustomPriorityPicker"
import { TaskTitleInput } from "@/features/tasks/components/TaskTitleInput"
import { motion } from "motion/react"
import { CalendarBlank, Clock, Flag, Play, Pause, Stop, PencilSimple } from "@phosphor-icons/react"
import { TaskEditorModal } from "@/features/tasks/components/TaskEditorModal"

export type SerializedTaskNode = Spread<
  { taskId: string },
  SerializedLexicalNode
>

const TaskNodeComponent: React.FC<{
  taskId: string
  editor: LexicalEditor
  nodeKey: NodeKey
}> = ({ taskId, editor, nodeKey }) => {
  const tasks = useTaskStore((state) => state.tasks)
  const updateTask = useTaskStore((state) => state.updateTask)
  const deleteTask = useTaskStore((state) => state.deleteTask)

  const task = tasks.find((t) => t.id === taskId)

  const timer = useTaskTimerStore((state) => state.timers[taskId]) || {
    taskId,
    seconds: 0,
    isRunning: false,
  }
  const startTimer = useTaskTimerStore((state) => state.startTimer)
  const pauseTimer = useTaskTimerStore((state) => state.pauseTimer)
  const stopTimer = useTaskTimerStore((state) => state.stopTimer)

  const [localTitle, setLocalTitle] = useState(task?.title || "")
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    if (task) {
      setLocalTitle(task.title)
    }
  }, [task?.title])

  if (!task) {
    return (
      <div className="flex items-center justify-between bg-red-500/10 border border-red-500/30 py-2 px-3 rounded text-red-500 text-sm">
        <span>Task not found or deleted (ID: {taskId})</span>
        <button
          onClick={() => {
            editor.update(() => {
              const node = $getNodeByKey(nodeKey)
              if (node) node.remove()
            })
          }}
          className="hover:underline text-xs"
        >
          Remove block
        </button>
      </div>
    )
  }

  const handleBlur = () => {
    if (localTitle !== task.title) {
      updateTask(task.id, { title: localTitle })
    }
  }

  const handleDelete = () => {
    deleteTask(task.id)
    editor.update(() => {
      const node = $getNodeByKey(nodeKey)
      if (node) node.remove()
    })
  }

  return (
    <div className="flex items-center justify-between group relative bg-[var(--task-row-bg)] dark:bg-muted border border-[var(--task-row-border)] dark:border-border py-1.5 px-3 rounded hover:bg-[var(--task-row-hover-bg)] dark:hover:bg-muted/80 hover:border-muted-foreground/30 transition-colors duration-150 shadow-sm-none select-none">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div
          className={cn(
            "w-5 h-5 rounded border transition-all flex items-center justify-center cursor-pointer flex-shrink-0 shadow-sm-sm",
            task.completed
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/30 shadow-sm-inner"
              : "border-border hover:border-emerald-500/50 hover:bg-emerald-500/5 text-transparent"
          )}
          onClick={() => updateTask(task.id, { completed: !task.completed })}
        >
          {task.completed && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-2 rounded-sm h-2 bg-emerald-500 dark:bg-emerald-400"
            />
          )}
        </div>

        <TaskTitleInput
          value={localTitle}
          onChange={setLocalTitle}
          onBlur={handleBlur}
          isCompleted={task.completed}
          className="text-base font-medium"
        />

        <div className="flex items-center gap-2">
          {/* Date Pickers */}
          {!timer.isRunning && (
            <>
              <CustomDatePicker
                small
                value={task.startDate || ""}
                onChange={(v: string) => updateTask(task.id, { startDate: v })}
                placeholder="Start"
                icon={<CalendarBlank size={12} />}
              />

              <CustomDatePicker
                small
                value={task.deadline || ""}
                onChange={(v: string) => updateTask(task.id, { deadline: v })}
                placeholder="Deadline"
                icon={<Flag size={12} />}
              />
            </>
          )}

          {/* Time spent */}
          {timer.seconds >= 60 && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shadow-sm-sm shrink-0">
              <Clock size={10} />
              {(() => {
                const hrs = Math.floor(timer.seconds / 3600)
                const mins = Math.floor((timer.seconds % 3600) / 60)
                if (hrs > 0) {
                  return `${hrs}h ${mins}m`
                }
                return `${mins}m`
              })()}
            </span>
          )}

          {/* CustomStatusPicker */}
          <CustomStatusPicker
            status={task.status || (task.completed ? "done" : "open")}
            onChange={(s: "open" | "in progress" | "done") => updateTask(task.id, { status: s })}
          />

          {/* CustomPriorityPicker */}
          <CustomPriorityPicker
            priority={task.priority}
            onChange={(p: "low" | "medium" | "urgent" | undefined) => updateTask(task.id, { priority: p })}
          />

          {/* Task Timer Widget */}
          <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-border/60 shrink-0">
            {timer.isRunning && (
              <span className="text-[11px] font-semibold font-mono text-muted-foreground/80 tracking-tight select-none">
                {(() => {
                  const hrs = Math.floor(timer.seconds / 3600)
                  const mins = Math.floor((timer.seconds % 3600) / 60)
                  const secs = timer.seconds % 60
                  const pad = (n: number) => n.toString().padStart(2, '0')
                  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`
                })()}
              </span>
            )}

            {timer.isRunning ? (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  pauseTimer(task.id)
                }}
                className="p-1 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-all flex items-center justify-center shrink-0 cursor-pointer"
                title="Pause stopwatch"
              >
                <Pause size={12} weight="bold" />
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  startTimer(task.id)
                }}
                disabled={task.completed || task.status === "done"}
                className="p-1 rounded bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center shrink-0"
                title={task.completed || task.status === "done" ? "Open task to start timer" : "Start stopwatch"}
              >
                <Play size={12} weight="fill" />
              </button>
            )}

            {timer.seconds > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  stopTimer(task.id)
                }}
                className="p-1 rounded bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-all flex items-center justify-center shrink-0 cursor-pointer"
                title="Stop & Reset"
              >
                <Stop size={12} weight="fill" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0 ml-4 pl-4 border-l border-border transition-opacity opacity-0 group-hover:opacity-100">
        <button
          onClick={() => setIsModalOpen(true)}
          className="text-muted-foreground/60 hover:text-foreground transition-colors flex items-center justify-center w-8 h-8 hover:bg-muted rounded cursor-pointer"
          title="Edit task details"
        >
          <PencilSimple size={16} />
        </button>
      </div>

      {isModalOpen && (
        <TaskEditorModal
          taskId={task.id}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  )
}

export class TaskNode extends DecoratorNode<ReactNode> {
  __taskId: string

  static getType(): string {
    return "task-node"
  }

  static clone(node: TaskNode): TaskNode {
    return new TaskNode(node.__taskId, node.__key)
  }

  constructor(taskId: string, key?: NodeKey) {
    super(key)
    this.__taskId = taskId
  }

  createDOM(): HTMLElement {
    const el = document.createElement("div")
    el.className = "lexical-task-node-wrapper"
    el.style.width = "100%"
    el.style.height = "fit-content"
    el.style.display = "block"
    el.style.margin = "0"
    el.style.padding = "0"
    el.style.maxWidth = "100%"
    return el
  }

  updateDOM(): boolean {
    return false
  }

  static importJSON(json: SerializedTaskNode): TaskNode {
    return $createTaskNode(json.taskId)
  }

  exportJSON(): SerializedTaskNode {
    return {
      type: "task-node",
      taskId: this.__taskId,
      version: 1,
    }
  }

  decorate(editor: LexicalEditor, config: EditorConfig): ReactNode {
    return (
      <TaskNodeComponent
        taskId={this.__taskId}
        editor={editor}
        nodeKey={this.getKey()}
      />
    )
  }

  isInline(): boolean {
    return false
  }
  isKeyboardSelectable(): boolean {
    return true
  }
}

export function $createTaskNode(taskId: string): TaskNode {
  return $applyNodeReplacement(new TaskNode(taskId))
}

export function $isTaskNode(node: unknown): node is TaskNode {
  return node instanceof TaskNode
}
