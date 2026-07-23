import type { ReactNode } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { Sparkles } from "lucide-react";
import { requireTenantContext } from "@/lib/auth/tenant";
import { planLimits } from "@/lib/plans";
import { Sidebar } from "@/components/dashboard/sidebar";
import { SignOutButton } from "@/components/dashboard/signout-button";
import { Badge } from "@/components/ui/badge";
import {
  ThemeProvider,
  THEME_COOKIE,
  type Resolved,
} from "@/components/theme/theme-provider";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { BrandMark } from "@/components/ui/brand";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const ctx = await requireTenantContext();
  const plan = planLimits(ctx.planId);
  const cookieStore = await cookies();
  const initialTheme: Resolved =
    cookieStore.get(THEME_COOKIE)?.value === "dark" ? "dark" : "light";

  return (
    <ThemeProvider initialResolved={initialTheme}>
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-zinc-200/70 dark:border-zinc-800/70 bg-white dark:bg-zinc-900 md:flex">
        <Link
          href="/dashboard"
          className="flex h-16 items-center gap-2.5 border-b border-zinc-100 dark:border-zinc-800 px-5 text-[15px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-100"
        >
          <BrandMark size={32} className="shadow-[0_2px_12px_-2px_rgba(99,102,241,0.5)]" />
          Sitovai
        </Link>
        <Sidebar isPlatformAdmin={ctx.isPlatformAdmin} />
        <div className="mt-auto p-4">
          <div className="relative overflow-hidden rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-900 p-3.5 shadow-sm">
            <div className="pointer-events-none absolute -right-6 -top-8 h-20 w-20 rounded-full bg-indigo-100/80 blur-2xl" />
            <p className="truncate text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              {ctx.tenantName || "Your workspace"}
            </p>
            <div className="mt-2.5 flex items-center justify-between">
              <Badge variant="accent">{plan.label} plan</Badge>
              <Link
                href="/dashboard/billing"
                className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 transition hover:text-indigo-700 dark:hover:text-indigo-300"
              >
                <Sparkles className="h-3 w-3" /> Upgrade
              </Link>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-zinc-200/70 dark:border-zinc-800/70 bg-white/80 dark:bg-zinc-900/80 px-6 backdrop-blur-md">
          <div className="flex items-center gap-2.5 font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 md:hidden">
            <BrandMark size={28} />
            Sitovai
          </div>
          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle />
            <span className="hidden h-5 w-px bg-zinc-200 dark:bg-zinc-700 sm:block" />
            <div className="hidden items-center gap-2.5 sm:flex">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-semibold uppercase text-white">
                {(ctx.email ?? "?").slice(0, 1)}
              </span>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">{ctx.email}</span>
            </div>
            <span className="hidden h-5 w-px bg-zinc-200 dark:bg-zinc-700 sm:block" />
            <SignOutButton />
          </div>
        </header>
        <main className="flex-1 px-6 py-8">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
    </ThemeProvider>
  );
}
