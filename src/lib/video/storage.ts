import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// Rendered MP4s live in the private `avatar-videos` bucket (created in migration 0003).
// Provider result URLs expire, so the downloaded copy at `tenantId/videoId.mp4` is the
// canonical artifact. All access goes through the service role: uploads here, playback
// and downloads via short-lived signed URLs.

export const VIDEO_BUCKET = "avatar-videos";

/** Download a finished render from the provider and persist it. Returns the storage path. */
export async function storeRenderedVideo(
  tenantId: string,
  videoId: string,
  providerUrl: string,
): Promise<string> {
  const res = await fetch(providerUrl);
  if (!res.ok) {
    throw new Error(`Could not download rendered video (HTTP ${res.status}).`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());

  const path = `${tenantId}/${videoId}.mp4`;
  const admin = createAdminClient();
  const { error } = await admin.storage
    .from(VIDEO_BUCKET)
    .upload(path, buffer, { contentType: "video/mp4", upsert: true });
  if (error) throw new Error(`Could not store video: ${error.message}`);
  return path;
}

/** Short-lived signed URL for playback/download of a stored video. */
export async function getSignedVideoUrl(
  path: string,
  expiresInSeconds = 3600,
): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(VIDEO_BUCKET)
    .createSignedUrl(path, expiresInSeconds);
  if (error) return null;
  return data.signedUrl;
}

/** Best-effort cleanup when a series/product is deleted. */
export async function removeStoredVideos(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  try {
    const admin = createAdminClient();
    await admin.storage.from(VIDEO_BUCKET).remove(paths);
  } catch {
    // best effort — orphaned files are harmless
  }
}
