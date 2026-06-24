import type { CreateTaskResponse } from "@/lib/tasks/types";
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
