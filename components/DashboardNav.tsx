"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard, ListChecks, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard/tasks", label: "Tasks", icon: ListChecks },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1.5 overflow-x-auto md:flex-col md:overflow-visible">
      {navItems.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            className={cn(
              "flex min-h-10 items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-white/10 text-white"
                : "text-slate-400 hover:bg-white/5 hover:text-white",
            )}
            href={item.href}
            key={item.href}
          >
            <item.icon className={cn("size-4", active && "text-emerald-400")} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
