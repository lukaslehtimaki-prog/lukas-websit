import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireTenantContext } from "@/lib/auth/tenant";
import { createClient } from "@/lib/supabase/server";
import { avatarPreset, toneLabel } from "@/lib/video/avatars";
import { isDemoMode } from "@/lib/video/provider";
import { getSignedVideoUrl } from "@/lib/video/storage";
import { SeriesView } from "@/components/videos/series-view";

export const metadata = { title: "Video series · Sitexa" };

export default async function SeriesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireTenantContext();
  const { id } = await params;

  const supabase = await createClient();
  const { data: series } = await supabase
    .from("video_series")
    .select("id,avatar_key,tone,count,status,avatar_products(name,description)")
    .eq("id", id)
    .maybeSingle();
  if (!series) notFound();

  const { data: videoRows } = await supabase
    .from("videos")
    .select("id,hook_label,script,status,storage_path,duration_seconds,error")
    .eq("series_id", id)
    .order("created_at", { ascending: true });

  const videos = await Promise.all(
    (videoRows ?? []).map(async (v) => ({
      id: v.id as string,
      hookLabel: (v.hook_label as string) ?? "",
      script: v.script as string,
      status: v.status as string,
      signedUrl: v.storage_path
        ? await getSignedVideoUrl(v.storage_path as string)
        : null,
      durationSeconds: (v.duration_seconds as number | null) ?? null,
      error: (v.error as string | null) ?? null,
    })),
  );

  const s = series as unknown as {
    id: string;
    avatar_key: string;
    tone: string;
    status: string;
    avatar_products: { name: string; description: string } | null;
  };
  const preset = avatarPreset(s.avatar_key);

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/videos"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800"
      >
        <ArrowLeft className="h-4 w-4" /> Back to videos
      </Link>
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">
          {s.avatar_products?.name ?? "Untitled product"}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {preset.emoji} {preset.name} · {toneLabel(s.tone)} tone
        </p>
      </div>
      <SeriesView
        seriesId={s.id}
        initialStatus={s.status}
        initialVideos={videos}
        demoMode={isDemoMode()}
      />
    </div>
  );
}
