export type TaskStep = {
  id: string;
  step_order: number;
  description: string;
  status: "pending" | "done";
};

export type Task = {
  id: string;
  title: string;
  status: "pending" | "in_progress" | "completed";
  created_at?: string;
  task_steps: TaskStep[];
};

export type CreateTaskResponse = {
  id: string;
  title: string;
  status: Task["status"];
  steps: TaskStep[];
};

export type AgentActivity = {
  id: string;
  user_id: string;
  task_id: string | null;
  message: string;
  created_at: string;
};
