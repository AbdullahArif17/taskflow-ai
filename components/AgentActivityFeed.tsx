"use client";

import { useEffect, useState } from "react";
import { Activity, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import type { AgentActivity } from "@/lib/tasks/types";

export function AgentActivityFeed() {
  const [activities, setActivities] = useState<AgentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let isMounted = true;

    async function loadAndSubscribe() {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("Could not load activity for this session.");
        setIsLoading(false);
        return;
      }

      const { data, error: activityError } = await supabase
        .from("agent_activity")
        .select("id,user_id,task_id,message,created_at")
        .order("created_at", { ascending: false })
        .limit(20);

      if (!isMounted) {
        return;
      }

      if (activityError) {
        setError(activityError.message);
      } else {
        setActivities((data ?? []) as AgentActivity[]);
      }
      setIsLoading(false);

      const channel = supabase
        .channel(`agent-activity-${user.id}`)
        .on<AgentActivity>(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "agent_activity",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            setActivities((current) => [payload.new, ...current].slice(0, 20));
          },
        )
        .subscribe();

      return () => {
        void supabase.removeChannel(channel);
      };
    }

    let cleanup: (() => void) | undefined;
    void loadAndSubscribe().then((subscriptionCleanup) => {
      cleanup = subscriptionCleanup;
    });

    return () => {
      isMounted = false;
      cleanup?.();
    };
  }, []);

  return (
    <Card className="rounded-lg">
      <CardHeader className="border-b border-slate-100 pb-4">
        <CardTitle className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-md bg-cyan-50 text-cyan-700">
            <Activity className="size-4" />
          </span>
          Agent activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? <ActivitySkeleton /> : null}
        {error ? (
          <div className="flex gap-2 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4" />
            <p>{error}</p>
          </div>
        ) : null}
        {!isLoading && !error && activities.length === 0 ? (
          <p className="text-sm text-slate-600">No activity yet.</p>
        ) : null}
        {!isLoading && !error && activities.length > 0 ? (
          <ol className="max-h-[420px] space-y-4 overflow-y-auto pr-1">
            {activities.map((activity) => (
              <li className="border-l-2 border-emerald-200 pl-3" key={activity.id}>
                <p className="text-sm text-slate-800">{activity.message}</p>
                <time className="mt-1 block text-xs text-slate-500" dateTime={activity.created_at}>
                  {formatActivityTime(activity.created_at)}
                </time>
              </li>
            ))}
          </ol>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ActivitySkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((item) => (
        <Skeleton className="h-12 w-full rounded-lg" key={item} />
      ))}
    </div>
  );
}

function formatActivityTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}
