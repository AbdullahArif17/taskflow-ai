"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7faf8] px-4">
      <div className="w-full max-w-md text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-lg bg-red-50 text-red-600">
          <AlertTriangle className="size-6" />
        </span>
        <h1 className="mt-5 text-2xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          The page could not be loaded. Try the request again.
        </p>
        <Button className="mt-6" onClick={reset} type="button">
          <RefreshCw className="size-4" />
          Try again
        </Button>
      </div>
    </main>
  );
}
