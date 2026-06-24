import { CheckCircle2, Circle, ListChecks } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Task } from "@/lib/tasks/types";

type TaskCardProps = {
  task: Task;
};

export function TaskCard({ task }: TaskCardProps) {
  const sortedSteps = [...task.task_steps].sort((a, b) => a.step_order - b.step_order);

  return (
    <Card className="rounded-lg transition-transform duration-200 hover:-translate-y-0.5">
      <CardHeader className="border-b border-slate-100 pb-4">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="flex gap-2.5">
            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600">
              <ListChecks className="size-4" />
            </span>
            <span>{task.title}</span>
          </CardTitle>
          <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200/60">
            {task.status.replace("_", " ")}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <ol className="space-y-1">
          {sortedSteps.map((step) => (
            <li className="flex gap-3 rounded-md px-2 py-2.5 hover:bg-slate-50" key={step.id}>
              {step.status === "done" ? (
                <CheckCircle2 className="mt-0.5 size-4 text-emerald-600" />
              ) : (
                <Circle className="mt-0.5 size-4 text-slate-400" />
              )}
              <span className="text-sm leading-6 text-slate-700">{step.description}</span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
