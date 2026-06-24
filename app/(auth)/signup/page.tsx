import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthForm } from "@/components/AuthForm";

export default function SignupPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[430px] w-full max-w-md" />}>
      <AuthForm mode="signup" />
    </Suspense>
  );
}
