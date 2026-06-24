import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { DashboardNav } from "@/components/DashboardNav";
import { SignOutButton } from "@/components/SignOutButton";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    redirect("/login");
  }

  const supabase = await createClient();
  let user = null;
  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch {
    redirect("/login?error=auth_unavailable");
  }

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen text-slate-950">
      <div className="flex min-h-screen w-full flex-col md:flex-row">
        <aside className="border-b border-white/10 bg-[#17211f] px-4 py-4 text-white md:sticky md:top-0 md:flex md:h-screen md:w-64 md:shrink-0 md:flex-col md:border-b-0 md:border-r md:px-5 md:py-6">
          <div className="flex items-center justify-between gap-3">
            <Link className="flex items-center gap-2.5 font-semibold" href="/dashboard">
              <BrandLogo className="shadow-[0_0_24px_rgba(52,211,153,0.2)]" />
              TaskFlow AI
            </Link>
            <div className="md:hidden">
              <SignOutButton compact />
            </div>
          </div>
          <div className="mt-5 md:mt-10">
            <DashboardNav />
          </div>
          <div className="mt-auto hidden border-t border-white/10 pt-5 md:block">
            <p className="truncate text-sm text-slate-400">{user.email}</p>
            <div className="mt-3">
              <SignOutButton />
            </div>
          </div>
        </aside>
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 md:px-10 md:py-9 lg:px-12">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
