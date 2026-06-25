"use client";

import { useState } from "react";
import { GmailIntegrationCard } from "@/components/settings/GmailIntegrationCard";
import { ProfileSettingsCard } from "@/components/settings/ProfileSettingsCard";
import { SecuritySettingsCard } from "@/components/settings/SecuritySettingsCard";
import { UsageSettingsCard } from "@/components/settings/UsageSettingsCard";

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
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <ProfileSettingsCard
        email={email}
        initialDisplayName={initialDisplayName}
        onError={setError}
      />
      <UsageSettingsCard plan={plan} tasksUsed={tasksUsed} />
      <GmailIntegrationCard />
      <SecuritySettingsCard onError={setError} />
    </div>
  );
}
