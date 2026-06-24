import { PricingTable } from "@/components/PricingTable";

export default function BillingPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">Billing</h1>
        <p className="mt-2 text-slate-600">
          Compare plans and upgrade through Stripe Checkout in test mode.
        </p>
      </div>
      <PricingTable />
    </section>
  );
}
