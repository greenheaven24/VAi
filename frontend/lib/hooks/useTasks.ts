import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createTask, deleteTask, fetchTasks, reorderTasks, updateTask } from "@/lib/api/tasks";
import { useDateStore } from "@/store/dateStore";
import type { ReorderUpdate, Task, TaskInput } from "@/types/task";

export function useTasksQuery() {
  const selectedDate = useDateStore((s) => s.selectedDate);
  return {
    ...useQuery({
      queryKey: ["tasks", selectedDate],
      queryFn: () => fetchTasks(selectedDate),
    }),
    selectedDate,
  };
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TaskInput) => createTask(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: Partial<TaskInput> }) =>
      updateTask(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useReorderTasks() {
  const queryClient = useQueryClient();
  const selectedDate = useDateStore((s) => s.selectedDate);
  const queryKey = ["tasks", selectedDate];

  return useMutation({
    mutationFn: (updates: ReorderUpdate[]) => reorderTasks(updates),
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Task[]>(queryKey);

      if (previous) {
        const updateMap = new Map(updates.map((u) => [u.id, u]));
        const next = previous.map((task) => {
          const update = updateMap.get(task.id);
          return update ? { ...task, status: update.status, order: update.order } : task;
        });
        queryClient.setQueryData<Task[]>(queryKey, next);
      }

      return { previous };
    },
    onError: (_err, _updates, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
