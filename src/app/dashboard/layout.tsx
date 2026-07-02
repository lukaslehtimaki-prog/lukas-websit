import type { ReactNode } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { requireTenantContext } from "@/lib/auth/tenant";
import { planLimits } from "@/lib/plans";
import { Sidebar } from "@/components/dashboard/sidebar";
import { SignOutButton } from "@/components/dashboard/signout-button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const ctx = await requireTenantContext();
  const plan = planLimits(ctx.planId);

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-zinc-200/70 bg-white md:flex">
        <Link
          href="/dashboard"
          className="flex h-16 items-center gap-2.5 border-b border-zinc-100 px-5 text-[15px] font-semibold tracking-tight text-zinc-900"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-400 text-sm font-bold text-white shadow-[0_2px_12px_-2px_rgba(99,102,241,0.5)]">
            S
          </span>
          Sitexa
        </Link>
        <Sidebar isPlatformAdmin={ctx.isPlatformAdmin} />
        <div className="mt-auto p-4">
          <div className="relative overflow-hidden rounded-xl border border-zinc-200/80 bg-gradient-to-b from-white to-zinc-50 p-3.5 shadow-sm">
            <div className="pointer-events-none absolute -right-6 -top-8 h-20 w-20 rounded-full bg-indigo-100/80 blur-2xl" />
            <p className="truncate text-sm font-semibold text-zinc-800">
              {ctx.tenantName || "Your workspace"}
            </p>
            <div className="mt-2.5 flex items-center justify-between">
              <Badge variant="accent">{plan.label} plan</Badge>
              <Link
                href="/dashboard/billing"
                className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 transition hover:text-indigo-700"
              >
                <Sparkles className="h-3 w-3" /> Upgrade
              </Link>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-zinc-200/70 bg-white/80 px-6 backdrop-blur-md">
          <div className="flex items-center gap-2.5 font-semibold tracking-tight text-zinc-900 md:hidden">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-400 text-xs font-bold text-white">
              S
            </span>
            Sitexa
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden items-center gap-2.5 sm:flex">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-semibold uppercase text-white">
                {(ctx.email ?? "?").slice(0, 1)}
              </span>
              <span className="text-sm text-zinc-500">{ctx.email}</span>
            </div>
            <span className="hidden h-5 w-px bg-zinc-200 sm:block" />
            <SignOutButton />
          </div>
        </header>
        <main className="flex-1 px-6 py-8">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
