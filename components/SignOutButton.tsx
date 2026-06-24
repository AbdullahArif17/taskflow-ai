"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type SignOutButtonProps = {
  compact?: boolean;
};

export function SignOutButton({ compact = false }: SignOutButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignOut() {
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) {
        throw error;
      }
      router.replace("/login");
      router.refresh();
    } catch {
      window.location.assign("/login");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button
      aria-label="Sign out"
      className={
        compact
          ? "size-9 border-white/10 bg-white/5 p-0 text-slate-300 hover:bg-white/10 hover:text-white"
          : "h-9 w-full justify-start border-white/10 bg-white/5 px-3 text-slate-300 hover:bg-white/10 hover:text-white"
      }
      disabled={isLoading}
      onClick={handleSignOut}
      title="Sign out"
      type="button"
      variant="outline"
    >
      {isLoading ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
      {!compact ? <span>{isLoading ? "Signing out..." : "Sign out"}</span> : null}
    </Button>
  );
}
