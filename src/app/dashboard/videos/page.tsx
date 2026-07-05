import Link from "next/link";
import { Plus, Clapperboard } from "lucide-react";
import { requireTenantContext } from "@/lib/auth/tenant";
import { createClient } from "@/lib/supabase/server";
import { isAIConfigured } from "@/lib/env";
import { isDemoMode } from "@/lib/video/provider";
import { avatarPreset, toneLabel } from "@/lib/video/avatars";
import { cn } from "@/lib/utils";

export const metadata = { title: "Avatar videos · Sitexa" };

type SeriesRow = {
  id: string;
  avatar_key: string;
  tone: string;
  count: number;
  status: string;
  updated_at: string;
  avatar_products: { name: string } | null;
};

const statusStyles: Record<string, string> = {
  draft: "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300",
  rendering: "bg-amber-100 text-amber-700",
  complete: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
};

export default async function VideosPage() {
  await requireTenantContext();
  const supabase = await createClient();
  const { data } = await supabase
    .from("video_series")
    .select("id,avatar_key,tone,count,status,updated_at,avatar_products(name)")
    .order("updated_at", { ascending: false })
    .limit(200);
  const series = (data ?? []) as unknown as SeriesRow[];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Avatar videos</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Short AI spokesperson videos that sell your product — generate a series of
            variations and post the winners.
          </p>
        </div>
        <Link
          href="/dashboard/videos/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500"
        >
          <Plus className="h-4 w-4" /> New series
        </Link>
      </div>

      {isDemoMode() ? (
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800">
          Demo mode: without <code className="font-mono">HEYGEN_API_KEY</code>, renders
          return a sample clip instead of a real avatar video. Add the key and restart to
          generate real videos.
        </div>
      ) : null}
      {!isAIConfigured() ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Without <code className="font-mono">ANTHROPIC_API_KEY</code>, scripts use a basic
          template. Add the key and restart for AI-written sales scripts.
        </div>
      ) : null}

      {series.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-10 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Clapperboard className="h-6 w-6" />
          </div>
          <p className="mt-4 font-medium text-zinc-900 dark:text-zinc-100">No videos yet</p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Describe a product, pick a spokesperson, and get a series of short sales videos.
          </p>
          <Link
            href="/dashboard/videos/new"
            className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4" /> New series
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {series.map((s) => {
            const preset = avatarPreset(s.avatar_key);
            return (
              <Link
                key={s.id}
                href={`/dashboard/videos/${s.id}`}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 transition hover:border-indigo-300 hover:shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                      statusStyles[s.status] ?? statusStyles.draft,
                    )}
                  >
                    {s.status}
                  </span>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">
                    {s.count} video{s.count === 1 ? "" : "s"} · {toneLabel(s.tone)}
                  </span>
                </div>
                <p className="mt-3 font-medium text-zinc-900 dark:text-zinc-100">
                  {s.avatar_products?.name ?? "Untitled product"}
                </p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {preset.emoji} {preset.name} · updated{" "}
                  {new Date(s.updated_at).toLocaleDateString()}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
