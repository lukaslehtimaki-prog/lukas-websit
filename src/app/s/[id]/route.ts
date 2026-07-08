import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { renderSiteToHtml } from "@/lib/templates/render";
import type { SiteContent } from "@/lib/templates/types";

// Public hosting for a PUBLISHED generated site: /s/<siteId> returns the rendered
// HTML. Uses the service-role client (bypasses tenant RLS) but only ever serves a
// site whose status is "published", so nothing private is exposed.

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("sites")
    .select("content, template_id, status")
    .eq("id", id)
    .maybeSingle();

  const site = data as
    | { content: SiteContent; template_id: string; status: string }
    | null;

  if (!site || site.status !== "published") {
    // A friendly page: this URL travels in pitch emails, so a business owner
    // clicking an outdated link should see something presentable.
    const notFound = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" /><title>Website not available</title></head>
<body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#fafafa;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<div style="text-align:center;padding:48px 24px;max-width:420px;">
<div style="width:56px;height:56px;margin:0 auto 20px;border-radius:16px;background:linear-gradient(135deg,#4f46e5,#7c3aed);display:grid;place-items:center;color:#fff;font-size:26px;font-weight:700;">S</div>
<h1 style="margin:0 0 8px;font-size:22px;color:#18181b;">This website isn&rsquo;t available right now</h1>
<p style="margin:0;font-size:15px;line-height:1.6;color:#71717a;">The preview may have been taken down or moved. If someone sent you this link, reply to them for an up-to-date one.</p>
</div></body></html>`;
    return new Response(notFound, {
      status: 404,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  const html = renderSiteToHtml(site.content, site.template_id, {
    formAction: `/api/f/${id}`,
  });
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=0, must-revalidate",
    },
  });
}
