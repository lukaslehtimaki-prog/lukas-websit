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
    return new Response("This website is not published.", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  const html = renderSiteToHtml(site.content, site.template_id);
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=0, must-revalidate",
    },
  });
}
