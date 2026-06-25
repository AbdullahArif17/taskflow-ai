"use client";

import { CheckCircle2, Circle, ListChecks, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Task, TaskStep } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

type TaskCardProps = {
  task: Task;
  busyStepId?: string;
  isDeleting?: boolean;
  onDelete: (task: Task) => Promise<void>;
  onToggleStep: (task: Task, step: TaskStep) => Promise<void>;
};

const statusStyles = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200/60",
  in_progress: "bg-cyan-50 text-cyan-700 ring-cyan-200/60",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-200/60",
};

export function TaskCard({
  task,
  busyStepId,
  isDeleting = false,
  onDelete,
  onToggleStep,
}: TaskCardProps) {
  const sortedSteps = [...task.task_steps].sort((a, b) => a.step_order - b.step_order);
  const completedSteps = sortedSteps.filter((step) => step.status === "done").length;
  const progress = sortedSteps.length ? (completedSteps / sortedSteps.length) * 100 : 0;

  return (
    <Card className="transition-transform duration-200 hover:-translate-y-0.5">
      <CardHeader className="border-b border-slate-100 pb-4">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="flex min-w-0 gap-2.5">
            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600">
              <ListChecks className="size-4" />
            </span>
            <span className="break-words">{task.title}</span>
          </CardTitle>
          <div className="flex shrink-0 items-center gap-2">
            <span className={cn("rounded-md px-2 py-1 text-xs font-medium capitalize ring-1", statusStyles[task.status])}>
              {task.status.replace("_", " ")}
            </span>
            <Button
              aria-label={`Delete ${task.title}`}
              disabled={isDeleting}
              onClick={() => void onDelete(task)}
              size="icon-sm"
              title="Delete task"
              type="button"
              variant="ghost"
            >
              {isDeleting ? <Loader2 className="animate-spin" /> : <Trash2 className="text-slate-400" />}
            </Button>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-emerald-500 transition-[width]" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-xs text-slate-500">{completedSteps}/{sortedSteps.length}</span>
        </div>
      </CardHeader>
      <CardContent>
        <ol className="space-y-1">
          {sortedSteps.map((step) => {
            const isBusy = busyStepId === step.id;
            return (
              <li key={step.id}>
                <button
                  className="flex w-full gap-3 rounded-md px-2 py-2.5 text-left transition-colors hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
                  disabled={Boolean(busyStepId) || isDeleting}
                  onClick={() => void onToggleStep(task, step)}
                  type="button"
                >
                  {isBusy ? (
                    <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-emerald-600" />
                  ) : step.status === "done" ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                  ) : (
                    <Circle className="mt-0.5 size-4 shrink-0 text-slate-400" />
                  )}
                  <span className={cn("text-sm leading-6", step.status === "done" ? "text-slate-500 line-through" : "text-slate-700")}>
                    {step.description}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
