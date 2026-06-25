"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { createTask, deleteTask, updateTaskStep } from "@/lib/tasks/api";
import type { CreateTaskResponse, Task, TaskStep } from "@/lib/tasks/types";

function toTask(task: CreateTaskResponse): Task {
  return {
    id: task.id,
    title: task.title,
    status: task.status,
    task_steps: task.steps,
  };
}

export function useTaskWorkspace() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyStepId, setBusyStepId] = useState<string>();
  const [deletingTaskId, setDeletingTaskId] = useState<string>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTasks() {
      try {
        const { data, error: taskError } = await createClient()
          .from("tasks")
          .select("id,title,status,created_at,task_steps(id,step_order,description,status)")
          .order("created_at", { ascending: false });
        if (taskError) throw taskError;
        setTasks((data ?? []) as Task[]);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Could not load tasks.");
      } finally {
        setIsLoading(false);
      }
    }
    void loadTasks();
  }, []);

  async function getAccessToken() {
    const { data } = await createClient().auth.getSession();
    if (!data.session) throw new Error("Your session expired. Sign in again.");
    return data.session.access_token;
  }

  async function handleCreate(title: string) {
    setIsSubmitting(true);
    setError(null);
    try {
      const created = await createTask({ title, accessToken: await getAccessToken() });
      setTasks((current) => [toTask(created), ...current]);
      toast.success("Task plan created.");
    } catch (createError) {
      reportError(createError, "Task creation failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleStep(task: Task, step: TaskStep) {
    setBusyStepId(step.id);
    setError(null);
    try {
      const updated = await updateTaskStep({
        taskId: task.id,
        stepId: step.id,
        status: step.status === "done" ? "pending" : "done",
        accessToken: await getAccessToken(),
      });
      setTasks((current) => current.map((item) => item.id === task.id ? toTask(updated) : item));
      toast.success(step.status === "done" ? "Step reopened." : "Step completed.");
    } catch (updateError) {
      reportError(updateError, "Could not update step.");
    } finally {
      setBusyStepId(undefined);
    }
  }

  async function handleDelete(task: Task) {
    if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
    setDeletingTaskId(task.id);
    setError(null);
    try {
      await deleteTask({ taskId: task.id, accessToken: await getAccessToken() });
      setTasks((current) => current.filter((item) => item.id !== task.id));
      toast.success("Task deleted.");
    } catch (deleteError) {
      reportError(deleteError, "Could not delete task.");
    } finally {
      setDeletingTaskId(undefined);
    }
  }

  function reportError(cause: unknown, fallback: string) {
    const message = cause instanceof Error ? cause.message : fallback;
    setError(message);
    toast.error(message);
  }

  return {
    busyStepId,
    deletingTaskId,
    error,
    handleCreate,
    handleDelete,
    handleToggleStep,
    isLoading,
    isSubmitting,
    tasks,
  };
}
