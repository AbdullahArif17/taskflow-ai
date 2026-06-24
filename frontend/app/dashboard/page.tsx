import Link from "next/link";
import { ArrowRight, Bot, ListChecks, Sparkles, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [{ count: taskCount }, { count: runCount }, { data: profile }] = await Promise.all([
    supabase.from("tasks").select("*", { count: "exact", head: true }),
    supabase.from("agent_activity").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("plan,tasks_used_this_month").maybeSingle(),
  ]);

  const displayName =
    typeof user?.user_metadata?.display_name === "string" && user.user_metadata.display_name
      ? user.user_metadata.display_name
      : user?.email?.split("@")[0] ?? "there";

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-emerald-700">Workspace overview</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-normal">Welcome back, {displayName}</h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Turn your next goal into a focused plan and keep every step visible.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm text-slate-500">
              Total tasks
              <ListChecks className="size-4 text-emerald-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{taskCount ?? 0}</CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm text-slate-500">
              Current plan
              <Zap className="size-4 text-amber-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold capitalize">{profile?.plan ?? "free"}</CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm text-slate-500">
              Agent activity
              <Bot className="size-4 text-cyan-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{runCount ?? 0}</CardContent>
        </Card>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)]">
        <div className="relative overflow-hidden rounded-lg bg-[#17211f] p-6 text-white sm:p-8">
          <Sparkles className="size-6 text-emerald-400" />
          <h2 className="mt-8 max-w-lg text-2xl font-semibold">What do you want to accomplish next?</h2>
          <p className="mt-3 max-w-lg text-sm leading-6 text-slate-300">
            Give TaskFlow AI an outcome. It will generate a practical sequence you can review and track.
          </p>
          <Link
            className="mt-6 inline-flex h-9 items-center gap-2 rounded-md bg-emerald-400 px-3 text-sm font-medium text-[#10211c] transition-colors hover:bg-emerald-300"
            href="/dashboard/tasks"
          >
            Create a task
            <ArrowRight className="size-4" />
          </Link>
        </div>
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Monthly usage</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">
              {profile?.tasks_used_this_month ?? 0}
              <span className="ml-1 text-base font-normal text-slate-500">
                {profile?.plan === "pro" ? "tasks" : "/ 5 tasks"}
              </span>
            </p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{
                  width:
                    profile?.plan === "pro"
                      ? "100%"
                      : `${Math.min(((profile?.tasks_used_this_month ?? 0) / 5) * 100, 100)}%`,
                }}
              />
            </div>
            <p className="mt-3 text-sm text-slate-500">
              {profile?.plan === "pro" ? "Unlimited tasks are active." : "Usage resets each month."}
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
