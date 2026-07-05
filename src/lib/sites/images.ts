import "server-only";
import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

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

/** Upload one image and return its public URL. Path is scoped by tenant + site. */
export async function uploadSiteImage(
  tenantId: string,
  siteId: string,
  file: File,
): Promise<string> {
  await ensureBucket();
  const admin = createAdminClient();
  const ext =
    (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") ||
    "jpg";
  const path = `${tenantId}/${siteId}/${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await admin.storage
    .from(SITE_IMAGE_BUCKET)
    .upload(path, buffer, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });
  if (error) throw new Error(error.message);
  return admin.storage.from(SITE_IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}
