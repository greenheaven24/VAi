import { apiClient } from "@/lib/api/client";
import type { ReorderUpdate, Task, TaskInput } from "@/types/task";

export async function fetchTasks(date: string): Promise<Task[]> {
  const { data } = await apiClient.get<Task[]>("/api/tasks/", {
    params: { date },
  });
  return data;
}

export async function createTask(input: TaskInput): Promise<Task> {
  const { data } = await apiClient.post<Task>("/api/tasks/", input);
  return data;
}

export async function updateTask(id: number, input: Partial<TaskInput>): Promise<Task> {
  const { data } = await apiClient.patch<Task>(`/api/tasks/${id}/`, input);
  return data;
}

export async function deleteTask(id: number): Promise<void> {
  await apiClient.delete(`/api/tasks/${id}/`);
}

export async function reorderTasks(updates: ReorderUpdate[]): Promise<Task[]> {
  const { data } = await apiClient.post<Task[]>("/api/tasks/reorder/", { updates });
  return data;
}
