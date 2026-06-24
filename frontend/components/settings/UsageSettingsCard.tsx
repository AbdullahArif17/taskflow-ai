import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  plan: "free" | "pro";
  tasksUsed: number;
};

export function UsageSettingsCard({ plan, tasksUsed }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Plan and usage</CardTitle>
        <CardDescription>Your current TaskFlow AI allowance.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-sm text-slate-500">Current plan</p>
          <p className="mt-1 font-medium capitalize">{plan}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Tasks used this month</p>
          <p className="mt-1 font-medium">
            {tasksUsed}
            {plan === "free" ? " of 5" : " (unlimited)"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
