"use client";

import { FormEvent, useState } from "react";
import { Check, KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

type Props = {
  onError: (message: string | null) => void;
};

export function SecuritySettingsCard({ onError }: Props) {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setMessage(null);
    onError(null);
    try {
      const { error } = await createClient().auth.updateUser({ password });
      if (error) throw error;
      setPassword("");
      setMessage("Password updated.");
      toast.success("Password updated.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not update password.";
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
          <KeyRound className="size-5 text-slate-500" />
          Security
        </CardTitle>
        <CardDescription>Set a new password for this account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={changePassword}>
          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <Input autoComplete="new-password" id="new-password" minLength={8} onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
          </div>
          <div className="flex items-center gap-3">
            <Button disabled={isLoading} type="submit" variant="outline">
              {isLoading ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
              Change password
            </Button>
            {message ? <span className="flex items-center gap-1 text-sm text-emerald-700"><Check className="size-4" />{message}</span> : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
