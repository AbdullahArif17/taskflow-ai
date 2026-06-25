"use client";

import { AlertCircle, Inbox } from "lucide-react";
import { AgentActivityFeed } from "@/components/AgentActivityFeed";
import { TaskCard } from "@/components/TaskCard";
import { TaskCreateForm } from "@/components/TaskCreateForm";
import { Skeleton } from "@/components/ui/skeleton";
import { useTaskWorkspace } from "@/lib/tasks/useTaskWorkspace";

export function TaskWorkspace() {
  const workspace = useTaskWorkspace();

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[390px_minmax(0,1fr)] xl:grid-cols-[420px_minmax(0,1fr)]">
      <div className="space-y-4">
        <TaskCreateForm isSubmitting={workspace.isSubmitting} onCreate={workspace.handleCreate} />
        {workspace.error ? (
          <div className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4" />
            <p>{workspace.error}</p>
          </div>
        ) : null}
        <AgentActivityFeed />
      </div>
      <section className="min-w-0 space-y-4">
        {workspace.isLoading ? <TaskSkeletons /> : null}
        {!workspace.isLoading && workspace.tasks.length === 0 ? <EmptyTasks /> : null}
        {!workspace.isLoading
          ? workspace.tasks.map((task) => (
              <TaskCard
                busyStepId={workspace.busyStepId}
                isDeleting={workspace.deletingTaskId === task.id}
                key={task.id}
                onDelete={workspace.handleDelete}
                onToggleStep={workspace.handleToggleStep}
                task={task}
              />
            ))
          : null}
      </section>
    </div>
  );
}

function TaskSkeletons() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((item) => <Skeleton className="h-40 w-full rounded-lg" key={item} />)}
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
