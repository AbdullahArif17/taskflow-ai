"use client";

import { FormEvent, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

type TaskCreateFormProps = {
  isSubmitting: boolean;
  onCreate: (title: string) => Promise<void>;
};

export function TaskCreateForm({ isSubmitting, onCreate }: TaskCreateFormProps) {
  const [title, setTitle] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      return;
    }
    await onCreate(trimmedTitle);
    setTitle("");
  }

  return (
    <Card className="rounded-lg border-t-2 border-t-emerald-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
            <Sparkles className="size-4" />
          </span>
          Create task
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-3" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="task-title">Task</Label>
            <textarea
              className="min-h-32 w-full resize-y rounded-md border border-input bg-slate-50/70 px-3 py-3 text-sm leading-6 outline-none ring-offset-background transition-colors placeholder:text-muted-foreground focus:border-emerald-500 focus:bg-white focus-visible:ring-2 focus-visible:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSubmitting}
              id="task-title"
              maxLength={500}
              minLength={3}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Example: Plan a client onboarding workflow for next week"
              required
              value={title}
            />
          </div>
          <Button className="h-9 px-3" disabled={isSubmitting || title.trim().length < 3} type="submit">
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            Generate steps
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
