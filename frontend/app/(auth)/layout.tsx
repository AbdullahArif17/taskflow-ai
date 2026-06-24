import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#17211f] p-3 sm:p-5">
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-7xl overflow-hidden rounded-lg bg-white md:min-h-[calc(100vh-2.5rem)] md:grid-cols-[minmax(0,1.1fr)_480px]">
        <section className="relative hidden min-h-[680px] overflow-hidden md:block">
          <Image
            alt="An idea branching into an organized AI workflow"
            className="object-cover"
            fill
            priority
            sizes="(min-width: 768px) 65vw, 0px"
            src="/images/taskflow-workflow.png"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(11,18,17,0.25),rgba(11,18,17,0.02))]" />
          <div className="absolute inset-x-0 top-0 p-8 lg:p-12">
            <div className="flex items-center gap-2.5 font-semibold text-white">
              <BrandLogo />
              TaskFlow AI
            </div>
            <div className="mt-12 max-w-xl">
              <h1 className="text-4xl font-semibold leading-tight text-white lg:text-5xl">
                From one idea to a clear plan.
              </h1>
              <p className="mt-4 max-w-md text-base leading-7 text-slate-300">
                Turn natural-language goals into structured, actionable work with an AI planning workspace.
              </p>
              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-200">
                {["AI-generated steps", "Realtime activity", "Saved workflows"].map((item) => (
                  <span className="flex items-center gap-1.5" key={item}>
                    <CheckCircle2 className="size-4 text-emerald-400" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
        <section className="flex items-center justify-center bg-[#f7faf8] px-5 py-10 sm:px-10">
          <div className="w-full max-w-sm">
            <div className="mb-8 flex items-center gap-2.5 font-semibold text-slate-950 md:hidden">
              <BrandLogo />
              TaskFlow AI
            </div>
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
