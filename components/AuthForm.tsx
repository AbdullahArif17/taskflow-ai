"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "login" | "signup";

type AuthFormProps = {
  mode: AuthMode;
};

function getAuthErrorMessage(error: unknown) {
  if (error instanceof TypeError && error.message === "Failed to fetch") {
    return "Cannot reach Supabase. Check the project URL in frontend/.env.local and restart the frontend.";
  }

  return error instanceof Error ? error.message : "Authentication failed.";
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isLogin = mode === "login";
  const requestedNext = searchParams.get("next");
  const nextPath =
    requestedNext?.startsWith("/") && !requestedNext.startsWith("//")
      ? requestedNext
      : "/dashboard";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const supabase = createClient();
      const authResponse = isLogin ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${nextPath}` },
      });

      if (authResponse.error) {
        setError(authResponse.error.message);
        return;
      }

      if (!isLogin && !authResponse.data.session) {
        setMessage("Check your email to confirm your account, then sign in.");
        return;
      }

      router.push(nextPath);
      router.refresh();
    } catch (authError) {
      setError(getAuthErrorMessage(authError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full border-0 bg-transparent py-0 shadow-none ring-0">
      <CardHeader className="px-0">
        <CardTitle className="text-2xl font-semibold">
          {isLogin ? "Welcome back" : "Create your account"}
        </CardTitle>
        <CardDescription>
          {isLogin ? "Sign in to continue to your workspace." : "Start planning with TaskFlow AI."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-0">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" autoComplete="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" autoComplete={isLogin ? "current-password" : "new-password"} minLength={6} onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
          <Button className="h-10 w-full" disabled={isSubmitting} type="submit">
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
            {isLogin ? "Sign in" : "Sign up"}
            {!isSubmitting ? <ArrowRight className="ml-auto size-4" /> : null}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          {isLogin ? "No account yet?" : "Already have an account?"}{" "}
          <Link className="font-medium text-foreground underline-offset-4 hover:underline" href={isLogin ? "/signup" : "/login"}>
            {isLogin ? "Sign up" : "Sign in"}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
