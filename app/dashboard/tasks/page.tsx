import { TaskWorkspace } from "@/components/TaskWorkspace";

export default function TasksPage() {
  return (
    <section className="space-y-7">
      <div>
        <p className="text-sm font-medium text-emerald-700">AI workspace</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-normal">Tasks</h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Describe the outcome you want. The agent will turn it into actionable steps.
        </p>
      </div>
      <TaskWorkspace />
    </section>
  );
}
