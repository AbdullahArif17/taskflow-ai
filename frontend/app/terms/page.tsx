import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service | TaskFlow AI",
  description: "Terms of service for TaskFlow AI.",
};

const sections = [
  {
    title: "Use of the service",
    body: "TaskFlow AI helps users turn natural language goals into task plans and track progress. You are responsible for reviewing generated output before relying on it.",
  },
  {
    title: "Accounts",
    body: "You must use accurate account information and keep access to your account secure. You are responsible for activity that occurs under your account.",
  },
  {
    title: "AI output",
    body: "Generated plans may be incomplete, outdated, or inaccurate. TaskFlow AI does not provide legal, medical, financial, or other professional advice.",
  },
  {
    title: "Integrations",
    body: "Connected services such as Gmail are optional. When Gmail is connected, TaskFlow AI can create draft emails only after you request that action. You can disconnect integrations from Settings.",
  },
  {
    title: "Billing",
    body: "Paid plans, if enabled, are processed through Stripe. Subscription changes, cancellations, and payment handling are subject to Stripe's processing and the plan terms shown at checkout.",
  },
  {
    title: "Acceptable use",
    body: "Do not use TaskFlow AI to generate harmful, illegal, abusive, deceptive, or unauthorized content. Do not attempt to disrupt, reverse engineer, or abuse the service.",
  },
  {
    title: "Availability",
    body: "The service may change, experience downtime, or be discontinued. TaskFlow AI is provided without a guarantee of uninterrupted availability.",
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to TaskFlow AI
        </Link>

        <header className="mt-10 flex items-center gap-4 border-b border-border pb-8">
          <Image
            src="/brand/taskflow-logo-192.png"
            alt="TaskFlow AI logo"
            width={56}
            height={56}
            className="rounded-xl"
          />
          <div>
            <p className="text-sm font-medium text-primary">TaskFlow AI</p>
            <h1 className="text-3xl font-semibold tracking-tight">Terms of Service</h1>
            <p className="mt-2 text-sm text-muted-foreground">Effective date: June 26, 2026</p>
          </div>
        </header>

        <div className="mt-8 space-y-7 leading-7">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-semibold">{section.title}</h2>
              <p className="mt-2 text-muted-foreground">{section.body}</p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
