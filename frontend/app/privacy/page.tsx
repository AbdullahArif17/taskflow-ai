import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | TaskFlow AI",
  description: "Privacy policy for TaskFlow AI.",
};

const sections = [
  {
    title: "Information we collect",
    body: "TaskFlow AI stores the account email used to sign in, task prompts you submit, generated task plans, step completion status, billing status, and integration connection metadata.",
  },
  {
    title: "How we use information",
    body: "We use this information to authenticate your account, generate task plans, track your workflow progress, provide billing features, and keep connected integrations working.",
  },
  {
    title: "AI processing",
    body: "Task prompts can be sent to the configured AI provider to generate actionable steps. Do not submit sensitive personal, financial, medical, or confidential information unless you are comfortable with that provider processing it.",
  },
  {
    title: "Google Gmail integration",
    body: "If you connect Gmail, TaskFlow AI requests Gmail compose access so it can create draft emails when you explicitly ask it to. The app does not send email automatically. Gmail refresh tokens are encrypted before storage and can be removed by disconnecting Gmail in Settings.",
  },
  {
    title: "Payments",
    body: "Payments and subscriptions are processed by Stripe. TaskFlow AI stores subscription status and Stripe identifiers, but it does not store card numbers.",
  },
  {
    title: "Data deletion",
    body: "You can delete tasks from the dashboard and disconnect Gmail from Settings. For account-level deletion requests, contact the app owner through the support email shown in the OAuth consent screen.",
  },
  {
    title: "Changes",
    body: "This policy may be updated as TaskFlow AI changes. The latest version will be available on this page.",
  },
];

export default function PrivacyPage() {
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
            <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
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
