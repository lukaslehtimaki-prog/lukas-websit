import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { renderSiteToHtml } from "@/lib/templates/render";
import type { SiteContent } from "@/lib/templates/types";

// Private client review + buy link: /r/<siteId>?k=<reviewKey>. Renders the
// finished site (even before it is publicly published) so the agency can show
// a client, with a floating purchase bar. Access is gated by the per-site key,
// so nothing is exposed without the exact link. noindex.

export const dynamic = "force-dynamic";

function esc(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function notAvailable(): Response {
  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" /><title>Preview not available</title></head>
<body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#fafafa;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<div style="text-align:center;padding:48px 24px;max-width:420px;">
<div style="width:56px;height:56px;margin:0 auto 20px;border-radius:16px;background:linear-gradient(135deg,#4f46e5,#7c3aed);display:grid;place-items:center;color:#fff;font-size:26px;font-weight:700;">S</div>
<h1 style="margin:0 0 8px;font-size:22px;color:#18181b;">This preview link isn&rsquo;t valid</h1>
<p style="margin:0;font-size:15px;line-height:1.6;color:#71717a;">The link may be incomplete or out of date. Ask whoever sent it for a fresh one.</p>
</div></body></html>`;
  return new Response(html, {
    status: 404,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const key = req.nextUrl.searchParams.get("k") ?? "";
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("sites")
    .select("content, template_id")
    .eq("id", id)
    .maybeSingle();
  const site = data as
    | { content: SiteContent; template_id: string }
    | null;

  if (!site?.content?.reviewKey || key !== site.content.reviewKey) {
    return notAvailable();
  }

  const content = site.content;
  const origin = req.nextUrl.origin;
  let html = renderSiteToHtml(content, site.template_id, {
    formAction: `${origin}/api/f/${id}`,
  });

  // Floating purchase bar.
  const paid = Boolean(content.payment?.paidAt);
  const price = content.payment?.priceStr?.trim();
  const buyLink = content.payment?.link;
  const bar = paid
    ? `<div class="sv-bar sv-bar-paid"><span>✓ This website has been purchased — thank you!</span></div>`
    : `<div class="sv-bar">
        <div class="sv-bar-text">
          <strong>${esc(content.businessName)}</strong>
          <span>Like your new website?${price ? ` One-time price ${esc(price)}.` : ""}</span>
        </div>
        ${
          buyLink
            ? `<a class="sv-buy" href="${esc(buyLink)}">Get this website${price ? ` — ${esc(price)}` : ""}</a>`
            : `<span class="sv-note">Reply to the message you received to purchase.</span>`
        }
      </div>`;

  const css = `<style>
    body { padding-bottom: 92px !important; }
    .sv-bar { position: fixed; left: 0; right: 0; bottom: 0; z-index: 9999; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; padding: 14px 20px; background: #0b0b12; color: #fff; box-shadow: 0 -8px 30px rgba(0,0,0,.25); font-family: -apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; }
    .sv-bar-text { display: flex; flex-direction: column; line-height: 1.35; }
    .sv-bar-text strong { font-size: 15px; }
    .sv-bar-text span { font-size: 13px; color: #c7c7d1; }
    .sv-buy { background: linear-gradient(135deg,#6366f1,#8b5cf6); color: #fff; text-decoration: none; font-weight: 600; font-size: 15px; padding: 11px 22px; border-radius: 10px; white-space: nowrap; }
    .sv-note { font-size: 13px; color: #c7c7d1; }
    .sv-bar-paid { justify-content: center; background: #059669; font-weight: 600; }
    @media (max-width: 560px) { .sv-bar { flex-direction: column; align-items: stretch; text-align: center; } .sv-buy { text-align: center; } }
  </style>`;

  html = html.replace("</head>", `${css}</head>`).replace(
    "</body>",
    `${bar}</body>`,
  );

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex",
    },
  });
}
