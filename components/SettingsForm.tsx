"use client";

import { FormEvent, useState } from "react";
import { Check, KeyRound, Loader2, Save, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

type SettingsFormProps = {
  email: string;
  initialDisplayName: string;
  plan: "free" | "pro";
  tasksUsed: number;
};

export function SettingsForm({
  email,
  initialDisplayName,
  plan,
  tasksUsed,
}: SettingsFormProps) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [password, setPassword] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileLoading(true);
    setProfileMessage(null);
    setError(null);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        data: { display_name: displayName.trim() },
      });

      if (updateError) {
        setError(updateError.message);
      } else {
        setProfileMessage("Profile updated.");
      }
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Could not update profile.");
    } finally {
      setProfileLoading(false);
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordLoading(true);
    setPasswordMessage(null);
    setError(null);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        setError(updateError.message);
      } else {
        setPassword("");
        setPasswordMessage("Password updated.");
      }
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Could not update password.");
    } finally {
      setPasswordLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Card className="rounded-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserRound className="size-5 text-slate-500" />
            <CardTitle>Profile</CardTitle>
          </div>
          <CardDescription>Your basic account information.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={saveProfile}>
            <div className="space-y-2">
              <Label htmlFor="display-name">Display name</Label>
              <Input
                id="display-name"
                maxLength={80}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Your name"
                value={displayName}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input disabled id="email" type="email" value={email} />
            </div>
            <div className="flex items-center gap-3">
              <Button disabled={profileLoading} type="submit">
                {profileLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                Save profile
              </Button>
              {profileMessage ? (
                <span className="flex items-center gap-1 text-sm text-emerald-700">
                  <Check className="size-4" />
                  {profileMessage}
                </span>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-lg">
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

      <Card className="rounded-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <KeyRound className="size-5 text-slate-500" />
            <CardTitle>Security</CardTitle>
          </div>
          <CardDescription>Set a new password for this account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={changePassword}>
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <Input
                autoComplete="new-password"
                id="new-password"
                minLength={8}
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
            </div>
            <div className="flex items-center gap-3">
              <Button disabled={passwordLoading} type="submit" variant="outline">
                {passwordLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <KeyRound className="size-4" />
                )}
                Change password
              </Button>
              {passwordMessage ? (
                <span className="flex items-center gap-1 text-sm text-emerald-700">
                  <Check className="size-4" />
                  {passwordMessage}
                </span>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
