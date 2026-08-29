"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Dashboard error boundary. Catches anything that throws while rendering or
 * fetching inside /dashboard (a Supabase outage, a Stripe timeout) and keeps
 * the user inside a branded surface with a way out.
 *
 * The raw error is logged, never rendered: messages from the data layer can
 * carry ids, emails and query fragments.
 *
 * Next 16 passes `unstable_retry` — it re-fetches and re-renders the segment,
 * which is what this failure mode needs; `reset` alone only clears state.
 */
export default function DashboardError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard] unhandled error", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
        <AlertCircle className="h-6 w-6" />
      </span>
      <h1 className="mt-5 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        Something went wrong on our side
      </h1>
      <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
        This page could not be loaded. Nothing you have saved is affected. Try
        again — if it keeps happening, email support@sitovaiagency.com and we
        will reply within 1 business day.
      </p>
      {error.digest ? (
        <p className="mt-3 font-mono text-xs text-zinc-400 dark:text-zinc-600">
          Reference: {error.digest}
        </p>
      ) : null}
      <div className="mt-7 flex items-center justify-center gap-3">
        <Button onClick={() => unstable_retry()}>Try again</Button>
        <Link
          href="/dashboard"
          className="rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
