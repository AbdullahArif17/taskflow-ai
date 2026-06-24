"use client";

import { FormEvent, useState } from "react";
import { Check, Loader2, Save, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

type Props = {
  email: string;
  initialDisplayName: string;
  onError: (message: string | null) => void;
};

export function ProfileSettingsCard({ email, initialDisplayName, onError }: Props) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setMessage(null);
    onError(null);
    try {
      const { error } = await createClient().auth.updateUser({
        data: { display_name: displayName.trim() },
      });
      if (error) throw error;
      setMessage("Profile updated.");
      toast.success("Profile updated.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not update profile.";
      onError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserRound className="size-5 text-slate-500" />
          Profile
        </CardTitle>
        <CardDescription>Your basic account information.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={saveProfile}>
          <div className="space-y-2">
            <Label htmlFor="display-name">Display name</Label>
            <Input id="display-name" maxLength={80} onChange={(event) => setDisplayName(event.target.value)} placeholder="Your name" value={displayName} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input disabled id="email" type="email" value={email} />
          </div>
          <div className="flex items-center gap-3">
            <Button disabled={isLoading} type="submit">
              {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save profile
            </Button>
            {message ? <span className="flex items-center gap-1 text-sm text-emerald-700"><Check className="size-4" />{message}</span> : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
