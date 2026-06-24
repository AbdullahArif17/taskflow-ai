"use client";

import { useEffect, useState } from "react";
import { Check, CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { createCheckoutSession } from "@/lib/billing/api";
import { createClient } from "@/lib/supabase/client";

type Plan = "free" | "pro";

export function PricingTable() {
  const [plan, setPlan] = useState<Plan>("free");
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    async function loadPlan() {
      try {
        const { data, error: profileError } = await supabase
          .from("profiles")
          .select("plan")
          .maybeSingle();

        if (profileError) {
          setError(profileError.message);
        } else {
          setPlan(data?.plan === "pro" ? "pro" : "free");
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Could not load billing.");
      } finally {
        setIsLoading(false);
      }
    }
    void loadPlan();
  }, []);

  async function handleCheckout() {
    setIsCheckoutLoading(true);
    setError(null);
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setError("You need to sign in again before upgrading.");
      toast.error("Your session expired. Sign in again.");
      setIsCheckoutLoading(false);
      return;
    }

    try {
      const checkout = await createCheckoutSession(session.access_token);
      window.location.href = checkout.url;
    } catch (checkoutError) {
      const message = checkoutError instanceof Error ? checkoutError.message : "Checkout failed.";
      setError(message);
      toast.error(message);
      setIsCheckoutLoading(false);
    }
  }

  if (isLoading) {
    return <Skeleton className="h-72 w-full rounded-lg" />;
  }

  return (
    <div className="space-y-4">
      {error ? <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <PlanCard
          cta="Current plan"
          disabled
          features={["5 AI tasks per month", "Task step generation", "Realtime activity feed"]}
          isCurrent={plan === "free"}
          name="Free"
          price="$0"
        />
        <PlanCard
          cta={plan === "pro" ? "Current plan" : "Upgrade to Pro"}
          disabled={plan === "pro" || isCheckoutLoading}
          features={["Unlimited AI tasks", "Priority task planning", "Billing via Stripe test mode"]}
          isCurrent={plan === "pro"}
          isLoading={isCheckoutLoading}
          name="Pro"
          onClick={handleCheckout}
          price="$9/mo"
        />
      </div>
    </div>
  );
}

type PlanCardProps = {
  name: string;
  price: string;
  features: string[];
  cta: string;
  disabled: boolean;
  isCurrent: boolean;
  isLoading?: boolean;
  onClick?: () => void;
};

function PlanCard(props: PlanCardProps) {
  return (
    <Card className="rounded-lg">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle>{props.name}</CardTitle>
          {props.isCurrent ? <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">Active</span> : null}
        </div>
        <p className="text-3xl font-semibold">{props.price}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {props.features.map((feature) => (
            <li className="flex gap-2 text-sm text-slate-700" key={feature}>
              <Check className="mt-0.5 size-4 text-emerald-600" />
              {feature}
            </li>
          ))}
        </ul>
        <Button disabled={props.disabled} onClick={props.onClick} type="button">
          {props.isLoading ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
          {props.cta}
        </Button>
      </CardContent>
    </Card>
  );
}
