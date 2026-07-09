"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ExternalLink, RefreshCw, CheckCircle2 } from "lucide-react";
import {
  startConnectOnboardingAction,
  refreshConnectStatusAction,
} from "@/app/dashboard/settings/actions";

export function Payouts({
  hasAccount,
  ready,
  commissionPct,
}: {
  hasAccount: boolean;
  ready: boolean;
  commissionPct: number;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function connect() {
    setMessage(null);
    startTransition(async () => {
      const r = await startConnectOnboardingAction();
      if (r.error) setMessage(r.error);
      else if (r.url) window.location.href = r.url;
    });
  }

  function refresh() {
    setMessage(null);
    startTransition(async () => {
      const r = await refreshConnectStatusAction();
      if (r.error) setMessage(r.error);
      else {
        setMessage(
          r.ready
            ? "Payouts are active ✓"
            : "Stripe setup isn't finished yet — resume it below.",
        );
        router.refresh();
      }
    });
  }

  if (ready) {
    return (
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
        <div>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Payouts active
          </p>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
            Website sale payments go straight to your Stripe account, minus the{" "}
            {commissionPct}% platform fee.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Connect your own Stripe account to sell websites with the one-click Buy
        button. Customers pay you directly — Sitovai keeps a {commissionPct}%
        platform fee per sale. Without this, pitch emails still work, but
        buyers reply to you instead of paying online.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={connect}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ExternalLink className="h-4 w-4" />
          )}
          {hasAccount ? "Resume Stripe setup" : "Connect Stripe payouts"}
        </button>
        {hasAccount ? (
          <button
            onClick={refresh}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <RefreshCw className="h-4 w-4" /> Check status
          </button>
        ) : null}
        {message ? (
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {message}
          </span>
        ) : null}
      </div>
    </div>
  );
}
