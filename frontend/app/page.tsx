import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, CheckCircle2, Sparkles, Workflow, MailPlus } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "TaskFlow AI | AI Task Planning Workspace",
  description:
    "TaskFlow AI turns natural-language goals into actionable task plans, tracks progress, and can create Gmail drafts after user approval.",
};

const features = [
  {
    title: "Plan from natural language",
    description: "Describe an outcome and TaskFlow AI generates a practical step-by-step workflow.",
    icon: Sparkles,
  },
  {
    title: "Track execution",
    description: "Mark steps complete, follow task status, and review activity as work moves forward.",
    icon: Workflow,
  },
  {
    title: "Draft emails with Gmail",
    description: "Connect Gmail to create draft emails only when you explicitly request them.",
    icon: MailPlus,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3 font-semibold">
            <BrandLogo />
            TaskFlow AI
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            <Link className={buttonVariants({ variant: "ghost" })} href="/login">
              Sign in
            </Link>
            <Link className={buttonVariants()} href="/signup">
              Get started
              <ArrowRight className="size-4" />
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-[minmax(0,0.92fr)_minmax(420px,1.08fr)] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-primary">
            AI task planning workspace
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">
            TaskFlow AI turns goals into clear, trackable work.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
            TaskFlow AI helps users convert natural-language requests into actionable task plans,
            track step completion, review agent activity, manage subscription access, and create
            Gmail draft emails after connecting Gmail.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className={buttonVariants({ size: "lg" })} href="/signup">
              Create account
              <ArrowRight className="size-4" />
            </Link>
            <Link className={buttonVariants({ variant: "outline", size: "lg" })} href="/login">
              Open workspace
            </Link>
          </div>
          <div className="mt-8 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
            {["AI-generated steps", "Progress tracking", "Optional Gmail drafts"].map((item) => (
              <span className="flex items-center gap-2" key={item}>
                <CheckCircle2 className="size-4 text-primary" />
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <Image
            src="/images/taskflow-workflow.png"
            alt="TaskFlow AI workflow visualization showing ideas becoming organized tasks"
            width={1100}
            height={820}
            priority
            className="aspect-[4/3] h-full w-full object-cover"
          />
        </div>
      </section>

      <section className="border-y border-border bg-white/70">
        <div className="mx-auto grid max-w-6xl gap-4 px-6 py-10 md:grid-cols-3">
          {features.map((feature) => (
            <article className="rounded-lg border border-border bg-card p-5 shadow-sm" key={feature.title}>
              <feature.icon className="size-5 text-primary" />
              <h2 className="mt-4 font-semibold">{feature.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>TaskFlow AI is an AI planning tool for organizing and tracking user-defined work.</p>
        <div className="flex gap-4">
          <Link className="hover:text-foreground" href="/privacy">
            Privacy
          </Link>
          <Link className="hover:text-foreground" href="/terms">
            Terms
          </Link>
        </div>
      </footer>
    </main>
  );
}
