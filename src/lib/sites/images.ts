import "server-only";
import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchPlacePhoto } from "@/lib/places/client";

// Uploaded site images live in a PUBLIC bucket so generated (static, exportable) sites
// can embed the URLs directly. The bucket is created on demand via the service role,
// so no manual migration is needed.

export const SITE_IMAGE_BUCKET = "site-images";

async function ensureBucket(): Promise<void> {
  const admin = createAdminClient();
  const { data } = await admin.storage.getBucket(SITE_IMAGE_BUCKET);
  if (data) return;
  await admin.storage
    .createBucket(SITE_IMAGE_BUCKET, {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024,
      allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif"],
    })
    .catch(() => {
      // ignore "already exists" races
    });
}

/** Upload raw image bytes and return the public URL. Path is scoped by tenant + site. */
export async function uploadSiteImageBuffer(
  tenantId: string,
  siteId: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  await ensureBucket();
  const admin = createAdminClient();
  const ext = contentType.includes("png")
    ? "png"
    : contentType.includes("webp")
      ? "webp"
      : contentType.includes("gif")
        ? "gif"
        : "jpg";
  const path = `${tenantId}/${siteId}/${randomUUID()}.${ext}`;
  const { error } = await admin.storage
    .from(SITE_IMAGE_BUCKET)
    .upload(path, buffer, { contentType, upsert: false });
  if (error) throw new Error(error.message);
  return admin.storage.from(SITE_IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Upload one image and return its public URL. Path is scoped by tenant + site. */
export async function uploadSiteImage(
  tenantId: string,
  siteId: string,
  file: File,
): Promise<string> {
  return uploadSiteImageBuffer(
    tenantId,
    siteId,
    Buffer.from(await file.arrayBuffer()),
    file.type || "image/jpeg",
  );
}

/**
 * Download up to `max` of the business's Google photos and store copies in the
 * site's bucket. Best-effort: failures skip individual photos, never throw.
 */
export async function importPlacePhotos(
  tenantId: string,
  siteId: string,
  photoNames: string[],
  max = 4,
): Promise<string[]> {
  const urls: string[] = [];
  for (const name of photoNames.slice(0, max)) {
    try {
      const photo = await fetchPlacePhoto(name);
      if (!photo) continue;
      urls.push(
        await uploadSiteImageBuffer(tenantId, siteId, photo.buffer, photo.contentType),
      );
    } catch {
      // best effort — skip this photo
    }
  }
  return urls;
}
