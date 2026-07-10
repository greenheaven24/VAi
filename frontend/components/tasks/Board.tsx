"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useMemo, useState } from "react";
import { Column } from "@/components/tasks/Column";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskModal } from "@/components/tasks/TaskModal";
import { DeleteTaskConfirm } from "@/components/tasks/DeleteTaskConfirm";
import { EmptyState } from "@/components/shared/EmptyState";
import { Spinner } from "@/components/shared/Spinner";
import {
  useCreateTask,
  useDeleteTask,
  useReorderTasks,
  useTasksQuery,
  useUpdateTask,
} from "@/lib/hooks/useTasks";
import { STATUS_LABELS, TASK_STATUSES } from "@/types/task";
import type { ReorderUpdate, Task, TaskInput, TaskStatus } from "@/types/task";

function groupByStatus(tasks: Task[]): Record<TaskStatus, Task[]> {
  const groups: Record<TaskStatus, Task[]> = { todo: [], in_progress: [], done: [] };
  for (const task of tasks) {
    groups[task.status].push(task);
  }
  for (const status of TASK_STATUSES) {
    groups[status].sort((a, b) => a.order - b.order);
  }
  return groups;
}

function findContainer(id: string | number, groups: Record<TaskStatus, Task[]>): TaskStatus | null {
  if (TASK_STATUSES.includes(id as TaskStatus)) return id as TaskStatus;
  for (const status of TASK_STATUSES) {
    if (groups[status].some((t) => t.id === id)) return status;
  }
  return null;
}

export function Board() {
  const { data: tasks, isLoading, isError, selectedDate } = useTasksQuery();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const reorderTasks = useReorderTasks();

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null | "new">(null);
  const [confirmDelete, setConfirmDelete] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const groups = useMemo(() => groupByStatus(tasks ?? []), [tasks]);

  function handleDragStart(event: DragStartEvent) {
    const task = (tasks ?? []).find((t) => t.id === event.active.id);
    setActiveTask(task ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const sourceStatus = findContainer(active.id, groups);
    const destStatus = findContainer(over.id, groups);
    if (!sourceStatus || !destStatus) return;
    if (sourceStatus === destStatus && active.id === over.id) return;

    const sourceList = [...groups[sourceStatus]];
    const activeIndex = sourceList.findIndex((t) => t.id === active.id);
    if (activeIndex === -1) return;
    const [movedTask] = sourceList.splice(activeIndex, 1);

    const destList = sourceStatus === destStatus ? sourceList : [...groups[destStatus]];
    const isOverColumn = TASK_STATUSES.includes(over.id as TaskStatus);
    const destIndex = isOverColumn
      ? destList.length
      : Math.max(destList.findIndex((t) => t.id === over.id), 0);

    destList.splice(destIndex, 0, { ...movedTask, status: destStatus });

    const updates: ReorderUpdate[] = destList.map((t, idx) => ({
      id: t.id,
      status: destStatus,
      order: idx,
    }));
    if (sourceStatus !== destStatus) {
      sourceList.forEach((t, idx) => updates.push({ id: t.id, status: sourceStatus, order: idx }));
    }

    reorderTasks.mutate(updates);
  }

  function handleModalSubmit(input: TaskInput) {
    if (editingTask && editingTask !== "new") {
      updateTask.mutate(
        { id: editingTask.id, input },
        { onSuccess: () => setEditingTask(null) }
      );
    } else {
      createTask.mutate(input, { onSuccess: () => setEditingTask(null) });
    }
  }

  function handleConfirmDelete() {
    if (!confirmDelete) return;
    deleteTask.mutate(confirmDelete.id, {
      onSuccess: () => {
        setConfirmDelete(null);
        setEditingTask(null);
      },
    });
  }

  const totalTasks = tasks?.length ?? 0;

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {isLoading ? "Loading tasks…" : `${totalTasks} task${totalTasks === 1 ? "" : "s"} for this day`}
        </p>
        <button
          type="button"
          onClick={() => setEditingTask("new")}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
        >
          + Add task
        </button>
      </div>

      {isError ? (
        <EmptyState title="Couldn't load tasks" description="Check your connection and try again." />
      ) : isLoading ? (
        <div className="flex flex-1 items-center justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-3">
            {TASK_STATUSES.map((status) => (
              <Column
                key={status}
                status={status}
                label={STATUS_LABELS[status]}
                tasks={groups[status]}
                onTaskClick={setEditingTask}
              />
            ))}
          </div>
          <DragOverlay>
            {activeTask ? <TaskCard task={activeTask} onClick={() => {}} /> : null}
          </DragOverlay>
        </DndContext>
      )}

      {editingTask && (
        <TaskModal
          task={editingTask === "new" ? null : editingTask}
          defaultDueDate={selectedDate}
          onClose={() => setEditingTask(null)}
          onSubmit={handleModalSubmit}
          onDelete={
            editingTask !== "new" ? () => setConfirmDelete(editingTask) : undefined
          }
          isSaving={createTask.isPending || updateTask.isPending}
          error={createTask.isError || updateTask.isError}
        />
      )}

      {confirmDelete && (
        <DeleteTaskConfirm
          title={confirmDelete.title}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={handleConfirmDelete}
          isDeleting={deleteTask.isPending}
        />
      )}
    </div>
  );
}
