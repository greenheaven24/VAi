"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { Task, TaskStatus } from "@/types/task";
import { TaskCard } from "@/components/tasks/TaskCard";
import { EmptyState } from "@/components/shared/EmptyState";

const COLUMN_ACCENTS: Record<TaskStatus, string> = {
  todo: "bg-slate-400",
  in_progress: "bg-amber-400",
  done: "bg-emerald-400",
};

export function Column({
  status,
  label,
  tasks,
  onTaskClick,
}: {
  status: TaskStatus;
  label: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-xl bg-slate-100/70 p-3">
      <div className="mb-3 flex items-center gap-2 px-1">
        <span className={`h-2 w-2 rounded-full ${COLUMN_ACCENTS[status]}`} />
        <h2 className="text-sm font-semibold text-slate-700">{label}</h2>
        <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500">
          {tasks.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex min-h-24 flex-1 flex-col gap-2 overflow-y-auto rounded-lg p-1 transition ${
          isOver ? "bg-brand/5 ring-2 ring-brand/30" : ""
        }`}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <EmptyState title="No tasks" description="Drop a task here or add one" />
          ) : (
            tasks.map((task) => (
              <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}
