import type { CreateTaskResponse, TaskStep } from "@/lib/tasks/types";
import { apiRequest } from "@/lib/api/client";

type CreateTaskInput = {
  title: string;
  accessToken: string;
};

export async function createTask({
  title,
  accessToken,
}: CreateTaskInput): Promise<CreateTaskResponse> {
  return apiRequest<CreateTaskResponse>("/tasks", {
    method: "POST",
    accessToken,
    body: JSON.stringify({ title }),
  });
}

export async function updateTaskStep(input: {
  taskId: string;
  stepId: string;
  status: TaskStep["status"];
  accessToken: string;
}): Promise<CreateTaskResponse> {
  return apiRequest<CreateTaskResponse>(`/tasks/${input.taskId}/steps/${input.stepId}`, {
    method: "PATCH",
    accessToken: input.accessToken,
    body: JSON.stringify({ status: input.status }),
    timeoutMs: 30000,
  });
}

export async function deleteTask(input: {
  taskId: string;
  accessToken: string;
}): Promise<{ deleted: boolean }> {
  return apiRequest<{ deleted: boolean }>(`/tasks/${input.taskId}`, {
    method: "DELETE",
    accessToken: input.accessToken,
    timeoutMs: 30000,
  });
}
