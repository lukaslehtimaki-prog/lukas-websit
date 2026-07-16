"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, ExternalLink } from "lucide-react";
import { startCheckout, openBillingPortal } from "@/app/dashboard/billing/actions";
import { hasActiveSubscription } from "@/lib/subscription";
import { cn } from "@/lib/utils";
import type { PlanId } from "@/lib/plans";

const PLANS: {
  id: PlanId;
  name: string;
  price: string;
  period: string;
  features: string[];
}[] = [
  {
    id: "pro",
    name: "Standard",
    price: "€20",
    period: "/mo",
    features: [
      "50 lead searches / month",
      "15 AI websites / month",
      "Website message inbox",
      "1 seat",
      "YTJ registry matching",
      "CSV export",
    ],
  },
  {
    id: "premium",
    name: "Pro",
    price: "€100",
    period: "/mo",
    features: [
      "5,000 lead searches / month",
      "500 AI websites / month",
      "AI pitch emails with one-click buy",
      "5 team seats",
      "Priority AI generation",
      "Everything in Standard",
    ],
  },
];

type Result = { url?: string; error?: string };

export function PlanCards({
  currentPlan,
  status,
  configured,
  isOwner,
}: {
  currentPlan: string;
  status: string;
  configured: boolean;
  isOwner: boolean;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const active = hasActiveSubscription(status);

  function go(fn: () => Promise<Result>) {
    setError(null);
    start(async () => {
      const r = await fn();
      if (r.url) window.location.href = r.url;
      else if (r.error) setError(r.error);
    });
  }

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {!isOwner ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Only workspace owners can change the plan.
        </p>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2">
        {PLANS.map((p) => {
          const isCurrent = active && currentPlan === p.id;
          return (
            <div
              key={p.id}
              className={cn(
                "flex flex-col rounded-2xl border p-6",
                isCurrent
                  ? "border-zinc-900 shadow-sm"
                  : "border-zinc-200/70 dark:border-zinc-800/70",
              )}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{p.name}</h3>
                {isCurrent ? (
                  <span className="rounded-full bg-zinc-900 px-2.5 py-0.5 text-xs font-medium text-white">
                    Current
                  </span>
                ) : null}
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-semibold tracking-tight">
                  {p.price}
                </span>
                <span className="text-sm text-zinc-500 dark:text-zinc-400">{p.period}</span>
              </div>
              <ul className="mt-5 flex-1 space-y-2.5 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-zinc-600 dark:text-zinc-300">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                {isCurrent || active ? (
                  <button
                    onClick={() => go(openBillingPortal)}
                    disabled={!isOwner || pending}
                    className="w-full rounded-[10px] border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-800 dark:text-zinc-100 transition hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-60"
                  >
                    {isCurrent ? "Manage billing" : `Switch to ${p.name}`}
                  </button>
                ) : (
                  <button
                    onClick={() => go(() => startCheckout(p.id))}
                    disabled={!configured || !isOwner || pending}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60"
                  >
                    {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Get started
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {active ? (
        <button
          onClick={() => go(openBillingPortal)}
          disabled={pending}
          className="inline-flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
        >
          Manage billing &amp; payment method{" "}
          <ExternalLink className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}
