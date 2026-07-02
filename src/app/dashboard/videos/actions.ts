"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireTenantContext } from "@/lib/auth/tenant";
import { createClient } from "@/lib/supabase/server";
import { isAIConfigured } from "@/lib/env";
import { checkLimit, recordUsage } from "@/lib/usage";
import { avatarPreset } from "@/lib/video/avatars";
import { getVideoProvider, providerFor } from "@/lib/video/provider";
import {
  generateVideoScripts,
  fallbackScripts,
  type ProductBrief,
  type ScriptVariation,
} from "@/lib/ai/video-scripts";
import {
  storeRenderedVideo,
  getSignedVideoUrl,
  removeStoredVideos,
} from "@/lib/video/storage";

export type NewSeriesState = { error?: string };

type VideoRow = {
  id: string;
  series_id: string;
  hook_label: string;
  script: string;
  provider: string;
  provider_job_id: string | null;
  status: "draft" | "queued" | "rendering" | "ready" | "failed";
  storage_path: string | null;
  duration_seconds: number | null;
  error: string | null;
};

async function buildScripts(brief: ProductBrief): Promise<ScriptVariation[]> {
  if (isAIConfigured()) {
    try {
      return await generateVideoScripts(brief);
    } catch {
      return fallbackScripts(brief);
    }
  }
  return fallbackScripts(brief);
}

export async function createVideoSeriesAction(
  _prev: NewSeriesState,
  formData: FormData,
): Promise<NewSeriesState> {
  const ctx = await requireTenantContext();

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const sellingPoints = String(formData.get("sellingPoints") ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 8);
  const imageUrl = String(formData.get("imageUrl") ?? "").trim() || null;
  const avatarKey = String(formData.get("avatarKey") ?? "");
  const tone = String(formData.get("tone") ?? "casual");
  const count = Math.min(5, Math.max(1, Number(formData.get("count") ?? 1) || 1));

  if (!name) return { error: "Give the product a name." };
  if (!description) return { error: "Describe the product in a sentence or two." };

  const limit = await checkLimit(
    ctx.planId,
    ctx.subscriptionStatus,
    ctx.isPlatformAdmin,
    "avatar_video",
  );
  if (limit.limit === 0) {
    return {
      error:
        "Your workspace has no active plan. Start your free trial from Billing to generate videos.",
    };
  }
  if (limit.remaining < count) {
    return {
      error: `Only ${limit.remaining} of ${limit.limit} video generations left this month — pick ${
        limit.remaining === 0 ? "a later date" : `at most ${limit.remaining} variation(s)`
      }.`,
    };
  }

  const preset = avatarPreset(avatarKey);
  const scripts = await buildScripts({
    name,
    description,
    sellingPoints,
    tone,
    persona: `${preset.name} — ${preset.description}`,
    variationCount: count,
  });

  const supabase = await createClient();
  const { data: product, error: productError } = await supabase
    .from("avatar_products")
    .insert({
      tenant_id: ctx.tenantId,
      created_by: ctx.userId,
      name,
      description,
      selling_points: sellingPoints,
      image_url: imageUrl,
      tone,
    })
    .select("id")
    .single();
  if (productError || !product) {
    return { error: productError?.message ?? "Could not save the product." };
  }

  const { data: series, error: seriesError } = await supabase
    .from("video_series")
    .insert({
      tenant_id: ctx.tenantId,
      product_id: product.id,
      created_by: ctx.userId,
      avatar_key: preset.key,
      tone,
      count: scripts.length,
    })
    .select("id")
    .single();
  if (seriesError || !series) {
    return { error: seriesError?.message ?? "Could not create the series." };
  }

  const { error: videosError } = await supabase.from("videos").insert(
    scripts.map((s) => ({
      tenant_id: ctx.tenantId,
      series_id: series.id,
      hook_label: s.hook,
      script: s.script,
      status: "draft",
    })),
  );
  if (videosError) return { error: videosError.message };

  revalidatePath("/dashboard/videos");
  redirect(`/dashboard/videos/${series.id}`);
}

export async function updateVideoScript(
  videoId: string,
  script: string,
): Promise<{ error?: string }> {
  await requireTenantContext();
  const trimmed = script.trim();
  if (!trimmed) return { error: "The script can't be empty." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("videos")
    .update({ script: trimmed, updated_at: new Date().toISOString() })
    .eq("id", videoId)
    .eq("status", "draft"); // scripts are locked once rendering starts
  if (error) return { error: error.message };
  return {};
}

export async function regenerateScriptsAction(
  seriesId: string,
): Promise<{ error?: string }> {
  await requireTenantContext();
  const supabase = await createClient();

  const { data: series } = await supabase
    .from("video_series")
    .select("id,avatar_key,tone,count,status,product_id")
    .eq("id", seriesId)
    .maybeSingle();
  if (!series) return { error: "Series not found." };
  if (series.status !== "draft") return { error: "This series has already been rendered." };

  const { data: product } = await supabase
    .from("avatar_products")
    .select("name,description,selling_points")
    .eq("id", series.product_id)
    .maybeSingle();
  if (!product) return { error: "Product not found." };

  const preset = avatarPreset(series.avatar_key);
  const scripts = await buildScripts({
    name: product.name,
    description: product.description,
    sellingPoints: (product.selling_points as string[]) ?? [],
    tone: series.tone,
    persona: `${preset.name} — ${preset.description}`,
    variationCount: series.count,
  });

  const { data: existing } = await supabase
    .from("videos")
    .select("id")
    .eq("series_id", seriesId)
    .eq("status", "draft")
    .order("created_at", { ascending: true });

  for (const [i, row] of (existing ?? []).entries()) {
    const s = scripts[i];
    if (!s) break;
    await supabase
      .from("videos")
      .update({
        hook_label: s.hook,
        script: s.script,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);
  }

  revalidatePath(`/dashboard/videos/${seriesId}`);
  return {};
}

export async function startRenderAction(
  seriesId: string,
): Promise<{ error?: string }> {
  const ctx = await requireTenantContext();
  const supabase = await createClient();

  const { data: series } = await supabase
    .from("video_series")
    .select("id,avatar_key,status,product_id")
    .eq("id", seriesId)
    .maybeSingle();
  if (!series) return { error: "Series not found." };
  if (series.status !== "draft") return { error: "Rendering has already started." };

  const { data: drafts } = await supabase
    .from("videos")
    .select("id,script")
    .eq("series_id", seriesId)
    .eq("status", "draft")
    .order("created_at", { ascending: true });
  if (!drafts || drafts.length === 0) return { error: "Nothing to render." };

  const limit = await checkLimit(
    ctx.planId,
    ctx.subscriptionStatus,
    ctx.isPlatformAdmin,
    "avatar_video",
  );
  if (limit.remaining < drafts.length) {
    return {
      error: `Rendering ${drafts.length} videos would exceed your remaining ${limit.remaining} generation(s) this month.`,
    };
  }

  const { data: product } = await supabase
    .from("avatar_products")
    .select("name")
    .eq("id", series.product_id)
    .maybeSingle();

  const preset = avatarPreset(series.avatar_key);
  const provider = getVideoProvider();

  let queued = 0;
  for (const draft of drafts) {
    try {
      const { jobId } = await provider.createVideo({
        script: draft.script,
        avatarId: preset.heygenAvatarId,
        voiceId: preset.heygenVoiceId,
        title: `${product?.name ?? "Product"} — ${preset.name}`,
      });
      await supabase
        .from("videos")
        .update({
          status: "queued",
          provider: provider.id,
          provider_job_id: jobId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", draft.id);
      queued += 1;
    } catch (e) {
      await supabase
        .from("videos")
        .update({
          status: "failed",
          error: e instanceof Error ? e.message : "Could not start the render.",
          updated_at: new Date().toISOString(),
        })
        .eq("id", draft.id);
    }
  }

  await supabase
    .from("video_series")
    .update({
      status: queued > 0 ? "rendering" : "failed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", seriesId);

  if (queued > 0) {
    await recordUsage(ctx.tenantId, ctx.userId, "avatar_video", queued, { seriesId });
  }

  revalidatePath(`/dashboard/videos/${seriesId}`);
  revalidatePath("/dashboard/videos");
  return queued > 0 ? {} : { error: "All renders failed to start — see the videos for details." };
}

export type SeriesSnapshot = {
  seriesStatus: string;
  videos: Array<{
    id: string;
    hookLabel: string;
    script: string;
    status: string;
    signedUrl: string | null;
    durationSeconds: number | null;
    error: string | null;
  }>;
};

/**
 * Reconcile in-flight renders with the provider and return a fresh snapshot.
 * Idempotent — safe to call from a polling interval and on page load, so renders
 * finish even if the tab was closed while they were in flight.
 */
export async function pollSeriesAction(seriesId: string): Promise<SeriesSnapshot | null> {
  const ctx = await requireTenantContext();
  const supabase = await createClient();

  const { data } = await supabase
    .from("videos")
    .select(
      "id,series_id,hook_label,script,provider,provider_job_id,status,storage_path,duration_seconds,error",
    )
    .eq("series_id", seriesId)
    .order("created_at", { ascending: true });
  const rows = (data ?? []) as VideoRow[];
  if (rows.length === 0) return null;

  for (const row of rows) {
    if ((row.status !== "queued" && row.status !== "rendering") || !row.provider_job_id) {
      continue;
    }
    try {
      const provider = providerFor(row.provider);
      const job = await provider.getStatus(row.provider_job_id);

      if (job.status === "completed" && job.videoUrl) {
        if (row.storage_path) continue; // already persisted by a concurrent poll
        const path = await storeRenderedVideo(ctx.tenantId, row.id, job.videoUrl);
        const duration = job.durationSeconds ?? 30;
        await supabase
          .from("videos")
          .update({
            status: "ready",
            storage_path: path,
            video_url: null, // provider URLs expire; storage_path is canonical
            duration_seconds: duration,
            cost_cents: provider.estimateCostCents(duration),
            updated_at: new Date().toISOString(),
          })
          .eq("id", row.id);
        row.status = "ready";
        row.storage_path = path;
        row.duration_seconds = duration;
      } else if (job.status === "failed") {
        await supabase
          .from("videos")
          .update({
            status: "failed",
            error: job.error ?? "Render failed.",
            updated_at: new Date().toISOString(),
          })
          .eq("id", row.id);
        row.status = "failed";
        row.error = job.error ?? "Render failed.";
      } else if (row.status === "queued") {
        await supabase
          .from("videos")
          .update({ status: "rendering", updated_at: new Date().toISOString() })
          .eq("id", row.id);
        row.status = "rendering";
      }
    } catch {
      // transient provider/storage error — leave the row for the next poll
    }
  }

  const inFlight = rows.some((r) => r.status === "queued" || r.status === "rendering");
  const anyReady = rows.some((r) => r.status === "ready");
  const allDraft = rows.every((r) => r.status === "draft");
  const seriesStatus = allDraft
    ? "draft"
    : inFlight
      ? "rendering"
      : anyReady
        ? "complete"
        : "failed";
  await supabase
    .from("video_series")
    .update({ status: seriesStatus, updated_at: new Date().toISOString() })
    .eq("id", seriesId);

  return {
    seriesStatus,
    videos: await Promise.all(
      rows.map(async (r) => ({
        id: r.id,
        hookLabel: r.hook_label,
        script: r.script,
        status: r.status,
        signedUrl: r.storage_path ? await getSignedVideoUrl(r.storage_path) : null,
        durationSeconds: r.duration_seconds,
        error: r.error,
      })),
    ),
  };
}

export async function deleteSeriesAction(seriesId: string): Promise<void> {
  await requireTenantContext();
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("videos")
    .select("storage_path")
    .eq("series_id", seriesId);
  const paths = (rows ?? [])
    .map((r) => r.storage_path as string | null)
    .filter((p): p is string => Boolean(p));

  // Products are 1:1 with series in the v1 wizard — remove the product and let the
  // cascade take the series + videos with it.
  const { data: series } = await supabase
    .from("video_series")
    .select("product_id")
    .eq("id", seriesId)
    .maybeSingle();
  if (series?.product_id) {
    await supabase.from("avatar_products").delete().eq("id", series.product_id);
  } else {
    await supabase.from("video_series").delete().eq("id", seriesId);
  }

  await removeStoredVideos(paths);
  revalidatePath("/dashboard/videos");
  redirect("/dashboard/videos");
}
