"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Inbox } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { createTask } from "@/lib/tasks/api";
import type { CreateTaskResponse, Task } from "@/lib/tasks/types";
import { AgentActivityFeed } from "@/components/AgentActivityFeed";
import { TaskCard } from "@/components/TaskCard";
import { TaskCreateForm } from "@/components/TaskCreateForm";

export function TaskWorkspace() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: taskError } = await supabase
        .from("tasks")
        .select("id,title,status,created_at,task_steps(id,step_order,description,status)")
        .order("created_at", { ascending: false });

      if (taskError) {
        setError(taskError.message);
      } else {
        setTasks((data ?? []) as Task[]);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load tasks.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  async function handleCreate(title: string) {
    setIsSubmitting(true);
    setError(null);
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setError("You need to sign in again before creating a task.");
      toast.error("Your session expired. Sign in again.");
      setIsSubmitting(false);
      return;
    }

    try {
      const created = await createTask({ title, accessToken: session.access_token });
      setTasks((currentTasks) => [toTask(created), ...currentTasks]);
      toast.success("Task plan created.");
    } catch (createError) {
      const message = createError instanceof Error ? createError.message : "Task creation failed.";
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[390px_minmax(0,1fr)] xl:grid-cols-[420px_minmax(0,1fr)]">
      <div className="space-y-4">
        <TaskCreateForm isSubmitting={isSubmitting} onCreate={handleCreate} />
        {error ? (
          <div className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4" />
            <p>{error}</p>
          </div>
        ) : null}
        <AgentActivityFeed />
      </div>
      <section className="min-w-0 space-y-4">
        {isLoading ? <TaskSkeletons /> : null}
        {!isLoading && tasks.length === 0 ? <EmptyTasks /> : null}
        {!isLoading ? tasks.map((task) => <TaskCard key={task.id} task={task} />) : null}
      </section>
    </div>
  );
}

function toTask(task: CreateTaskResponse): Task {
  return {
    id: task.id,
    title: task.title,
    status: task.status,
    task_steps: task.steps,
  };
}

function TaskSkeletons() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((item) => (
        <Skeleton className="h-40 w-full rounded-lg" key={item} />
      ))}
    </div>
  );
}

function EmptyTasks() {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white/70 p-8 text-center">
      <span className="flex size-14 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
        <Inbox className="size-7" />
      </span>
      <h2 className="mt-4 text-lg font-semibold">No tasks yet</h2>
      <p className="mt-2 max-w-sm text-sm text-slate-600">
        Submit a natural language task and the agent will generate a step-by-step plan.
      </p>
    </div>
  );
}
