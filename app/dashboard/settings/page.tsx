import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/SettingsForm";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, tasks_used_this_month")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <section className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">Settings</h1>
        <p className="mt-2 text-slate-600">
          Manage your account details and security.
        </p>
      </div>
      <SettingsForm
        email={user.email ?? ""}
        initialDisplayName={
          typeof user.user_metadata?.display_name === "string"
            ? user.user_metadata.display_name
            : ""
        }
        plan={profile?.plan === "pro" ? "pro" : "free"}
        tasksUsed={profile?.tasks_used_this_month ?? 0}
      />
    </section>
  );
}
