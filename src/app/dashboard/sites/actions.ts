"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireTenantContext } from "@/lib/auth/tenant";
import { createClient } from "@/lib/supabase/server";
import { isAIConfigured, isPlacesConfigured, isResendConfigured } from "@/lib/env";
import { generatePitchEmail } from "@/lib/ai/pitch-email";
import { sendEmail } from "@/lib/email/send";
import {
  renderPitchEmailHtml,
  pitchTextWithOffer,
} from "@/lib/email/pitch-template";
import { getPlaceDetails, resolvePlace } from "@/lib/places/client";
import { generateWebsiteContent, fallbackContent } from "@/lib/ai/website-content";
import {
  inferSiteKind,
  defaultMembershipPlans,
} from "@/lib/templates/site-kind";
import { languageForCountry } from "@/lib/templates/i18n";
import { uploadSiteImage, importPlacePhotos } from "@/lib/sites/images";
import { checkLimit, recordUsage } from "@/lib/usage";
import type { BusinessInfo, SiteContent, SiteReview } from "@/lib/templates/types";

/** Tag the site with its business kind + starter data for the extra section. */
function applyKind(content: SiteContent, info: BusinessInfo, templateId: string) {
  content.kind = inferSiteKind(info.category, templateId, info.name);
  if (content.kind === "membership" && !content.membershipPlans?.length) {
    content.membershipPlans = defaultMembershipPlans(content.language);
  }
}

/**
 * Best-effort: copy the business's own Google photos into the site (hero + gallery)
 * and persist. Runs after the row exists; never blocks creation on failure.
 */
async function attachPlacePhotos(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tenantId: string,
  siteId: string,
  content: SiteContent,
  photoNames: string[],
): Promise<void> {
  if (!photoNames.length) return;
  try {
    const urls = await importPlacePhotos(tenantId, siteId, photoNames, 4);
    if (!urls.length) return;
    if (!content.heroImage) {
      content.heroImage = urls[0];
      content.gallery = [...(content.gallery ?? []), ...urls.slice(1)];
    } else {
      content.gallery = [...(content.gallery ?? []), ...urls];
    }
    await supabase.from("sites").update({ content }).eq("id", siteId);
  } catch {
    // photos are a bonus — never fail site creation over them
  }
}

export type NewSiteState = { error?: string };

async function buildContent(info: BusinessInfo): Promise<SiteContent> {
  if (isAIConfigured()) {
    try {
      return await generateWebsiteContent(info);
    } catch {
      return fallbackContent(info);
    }
  }
  return fallbackContent(info);
}

async function leadToBusinessInfo(
  supabase: Awaited<ReturnType<typeof createClient>>,
  lead: any,
): Promise<{ info: BusinessInfo; reviews: SiteReview[]; photoNames: string[] }> {
  let phone: string | null = lead.phone ?? null;
  let hours: string[] | null = null;
  let address: string | null = lead.address ?? null;
  let category: string | null = lead.category ?? null;
  let website: string | null = lead.website ?? null;
  let reviews: SiteReview[] = [];
  let photoNames: string[] = [];
  let language = "en";

  // On-demand detail fetch (phone / hours / reviews / photos / country) at build time.
  if (lead.place_id) {
    try {
      const d = await getPlaceDetails(lead.place_id);
      phone = d.phone ?? phone;
      hours = d.openingHours;
      address = d.address ?? address;
      category = d.category ?? category;
      website = d.website ?? website;
      reviews = d.reviews;
      photoNames = d.photoNames;
      language = languageForCountry(d.countryCode);
      if (phone && phone !== lead.phone) {
        await supabase.from("leads").update({ phone }).eq("id", lead.id);
      }
    } catch {
      // best effort; fall back to whatever the lead already had
    }
  }

  const info: BusinessInfo = {
    name: lead.name,
    placeId: lead.place_id ?? null,
    language,
    category,
    address,
    phone,
    email: lead.email ?? null,
    hours,
    website,
    location: lead.address ?? null,
    businessId: lead.business_id ?? null,
    industryLabel: null,
  };
  return { info, reviews, photoNames };
}

export async function createSiteFromLead(
  _prev: NewSiteState,
  formData: FormData,
): Promise<NewSiteState> {
  const ctx = await requireTenantContext();
  const leadId = String(formData.get("leadId") ?? "");
  const templateId = String(formData.get("templateId") ?? "salon");
  if (!leadId) return { error: "Pick a lead to build a site from." };

  const limit = await checkLimit(
    ctx.planId,
    ctx.subscriptionStatus,
    ctx.isPlatformAdmin,
    "site_generation",
  );
  if (!limit.allowed) {
    return {
      error:
        limit.limit === 0
          ? "Your workspace has no active plan. Start your 7-day free trial from Billing to generate sites."
          : `You've used all ${limit.limit} site generations on your plan this month.`,
    };
  }

  const supabase = await createClient();
  const { data: lead } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .maybeSingle();
  if (!lead) return { error: "Lead not found." };

  const { info, reviews, photoNames } = await leadToBusinessInfo(supabase, lead);
  const content = await buildContent(info);
  if (reviews.length) content.reviews = reviews;
  applyKind(content, info, templateId);

  const { data: site, error } = await supabase
    .from("sites")
    .insert({
      tenant_id: ctx.tenantId,
      lead_id: leadId,
      template_id: templateId,
      title: info.name,
      status: "generated",
      content,
      created_by: ctx.userId,
    })
    .select("id")
    .single();
  if (error || !site) return { error: error?.message ?? "Could not create site." };

  const siteId = (site as any).id as string;
  await attachPlacePhotos(supabase, ctx.tenantId, siteId, content, photoNames);
  await recordUsage(ctx.tenantId, ctx.userId, "site_generation");
  revalidatePath("/dashboard/sites");
  redirect(`/dashboard/sites/${siteId}`);
}

export async function createSiteFromInput(
  _prev: NewSiteState,
  formData: FormData,
): Promise<NewSiteState> {
  const ctx = await requireTenantContext();
  const input = String(formData.get("input") ?? "").trim();
  const templateId = String(formData.get("templateId") ?? "salon");
  if (!input)
    return { error: "Paste a Google Maps link, or type a business name and city." };
  if (!isPlacesConfigured())
    return { error: "Add GOOGLE_MAPS_API_KEY to look up a business by link or name." };

  const limit = await checkLimit(
    ctx.planId,
    ctx.subscriptionStatus,
    ctx.isPlatformAdmin,
    "site_generation",
  );
  if (!limit.allowed) {
    return {
      error:
        limit.limit === 0
          ? "Your workspace has no active plan. Start your 7-day free trial from Billing to generate sites."
          : `You've used all ${limit.limit} site generations on your plan this month.`,
    };
  }

  let details;
  try {
    details = await resolvePlace(input);
  } catch {
    return { error: "Lookup failed. Check your Places API key and that it is enabled." };
  }
  if (!details)
    return { error: "Couldn't find that business — try a more specific name + city." };

  const info: BusinessInfo = {
    name: details.name,
    placeId: details.placeId,
    language: languageForCountry(details.countryCode),
    category: details.category,
    address: details.address,
    phone: details.phone,
    email: null,
    hours: details.openingHours,
    website: details.website,
    location: details.address,
    businessId: null,
    industryLabel: null,
  };
  const content = await buildContent(info);
  if (details.reviews?.length) content.reviews = details.reviews;
  applyKind(content, info, templateId);

  const supabase = await createClient();
  const { data: site, error } = await supabase
    .from("sites")
    .insert({
      tenant_id: ctx.tenantId,
      lead_id: null,
      template_id: templateId,
      title: info.name,
      status: "generated",
      content,
      created_by: ctx.userId,
    })
    .select("id")
    .single();
  if (error || !site) return { error: error?.message ?? "Could not create site." };

  const siteId = (site as any).id as string;
  await attachPlacePhotos(
    supabase,
    ctx.tenantId,
    siteId,
    content,
    details.photoNames ?? [],
  );
  await recordUsage(ctx.tenantId, ctx.userId, "site_generation");
  revalidatePath("/dashboard/sites");
  redirect(`/dashboard/sites/${siteId}`);
}

export async function regenerateContent(
  siteId: string,
): Promise<{ content?: SiteContent; error?: string }> {
  await requireTenantContext();
  if (!isAIConfigured())
    return { error: "Add ANTHROPIC_API_KEY to regenerate AI copy." };

  const supabase = await createClient();
  const { data: site } = await supabase
    .from("sites")
    .select("content")
    .eq("id", siteId)
    .maybeSingle();
  const existing = (site as any)?.content as SiteContent | undefined;
  const source = existing?.source;
  if (!source) return { error: "No source business data stored for this site." };

  let content: SiteContent;
  try {
    // The editor's language picker wins over the originally detected language.
    content = await generateWebsiteContent(source, existing?.language);
  } catch {
    return { error: "AI generation failed. Try again in a moment." };
  }
  // Preserve real reviews + the chosen design + kind across an AI copy refresh.
  if (existing?.reviews?.length) content.reviews = existing.reviews;
  if (existing?.designSeed != null) content.designSeed = existing.designSeed;
  if (existing?.themeId) content.themeId = existing.themeId;
  if (existing?.kind) content.kind = existing.kind;
  if (existing?.membershipPlans?.length)
    content.membershipPlans = existing.membershipPlans;
  if (existing?.heroImage) content.heroImage = existing.heroImage;
  if (existing?.gallery?.length) content.gallery = existing.gallery;
  await supabase
    .from("sites")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("id", siteId);
  revalidatePath(`/dashboard/sites/${siteId}`);
  return { content };
}

export async function updateSiteContent(
  siteId: string,
  content: SiteContent,
  templateId?: string,
): Promise<{ ok?: boolean; error?: string }> {
  await requireTenantContext();
  const supabase = await createClient();
  const patch: Record<string, any> = {
    content,
    title: content.businessName,
    updated_at: new Date().toISOString(),
  };
  if (templateId) patch.template_id = templateId;
  const { error } = await supabase.from("sites").update(patch).eq("id", siteId);
  if (error) return { error: error.message };
  revalidatePath(`/dashboard/sites/${siteId}`);
  return { ok: true };
}

export async function setSiteStatus(
  siteId: string,
  status: string,
): Promise<void> {
  await requireTenantContext();
  const supabase = await createClient();
  await supabase
    .from("sites")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", siteId);
  revalidatePath(`/dashboard/sites/${siteId}`);
  revalidatePath("/dashboard/sites");
}

export async function uploadSiteImageAction(
  formData: FormData,
): Promise<{ url?: string; error?: string }> {
  const ctx = await requireTenantContext();
  const siteId = String(formData.get("siteId") ?? "misc");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0)
    return { error: "No image selected." };
  if (!file.type.startsWith("image/"))
    return { error: "Please choose an image file." };
  if (file.size > 5 * 1024 * 1024)
    return { error: "Image must be under 5 MB." };
  try {
    const url = await uploadSiteImage(ctx.tenantId, siteId, file);
    return { url };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Upload failed." };
  }
}

export async function generatePitchAction(
  siteId: string,
): Promise<{ to?: string; subject?: string; body?: string; error?: string }> {
  const ctx = await requireTenantContext();
  if (!isAIConfigured())
    return { error: "Add ANTHROPIC_API_KEY to draft pitch emails." };

  const supabase = await createClient();
  const { data: site } = await supabase
    .from("sites")
    .select("content, lead_id")
    .eq("id", siteId)
    .maybeSingle();
  if (!site) return { error: "Site not found." };
  const content = (site as any).content as SiteContent;

  let to = "";
  if ((site as any).lead_id) {
    const { data: lead } = await supabase
      .from("leads")
      .select("email")
      .eq("id", (site as any).lead_id)
      .maybeSingle();
    to = ((lead as any)?.email as string | null) ?? "";
  }
  // Fall back to the business email Google lists when the lead has none.
  if (!to) to = content.contact?.email ?? content.source?.email ?? "";

  const h = await headers();
  const base = h.get("origin") ?? `https://${h.get("host") ?? "localhost:3000"}`;
  try {
    const pitch = await generatePitchEmail({
      businessName: content.businessName,
      category: content.source?.category ?? null,
      location: content.source?.location ?? content.contact?.address ?? null,
      language: content.language ?? "fi",
      liveUrl: `${base}/s/${siteId}`,
      senderName: ctx.tenantName || ctx.email || "Sitovai",
    });
    return { to, ...pitch };
  } catch {
    return { error: "Could not draft the email. Try again in a moment." };
  }
}

export async function sendPitchAction(
  siteId: string,
  to: string,
  subject: string,
  body: string,
  offer?: { price?: string; paymentLink?: string },
): Promise<{ ok?: boolean; error?: string }> {
  const ctx = await requireTenantContext();
  if (!isResendConfigured())
    return { error: "Email sending isn't configured (RESEND_API_KEY)." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to.trim()))
    return { error: "Enter a valid recipient email address." };
  if (!subject.trim() || !body.trim())
    return { error: "Subject and message are both required." };
  const paymentLink = offer?.paymentLink?.trim();
  if (paymentLink && !/^https:\/\/.+\..+/.test(paymentLink))
    return { error: "The payment link must be a full https:// URL." };

  const supabase = await createClient();
  const { data: site } = await supabase
    .from("sites")
    .select("content")
    .eq("id", siteId)
    .maybeSingle();
  if (!site) return { error: "Site not found." };
  const content = (site as any).content as SiteContent;

  // Publish first so the preview link in the email actually works.
  await supabase
    .from("sites")
    .update({ status: "published", updated_at: new Date().toISOString() })
    .eq("id", siteId);

  const h = await headers();
  const base = h.get("origin") ?? `https://${h.get("host") ?? "localhost:3000"}`;
  const liveUrl = `${base}/s/${siteId}`;
  const cleanOffer = { price: offer?.price?.trim() || undefined, paymentLink };

  const r = await sendEmail({
    to: to.trim(),
    subject: subject.trim(),
    text: pitchTextWithOffer(body, content.language, cleanOffer),
    html: renderPitchEmailHtml({
      body,
      businessName: content.businessName,
      tagline: content.tagline,
      language: content.language ?? "fi",
      liveUrl,
      senderName: ctx.tenantName || ctx.email || "Sitovai",
      heroImage: content.heroImage,
      offer: cleanOffer,
    }),
    replyTo: ctx.email ?? undefined,
  });
  if (!r.ok) return { error: r.error };
  revalidatePath(`/dashboard/sites/${siteId}`);
  return { ok: true };
}

export async function importGooglePhotosAction(
  siteId: string,
): Promise<{ urls?: string[]; error?: string }> {
  const ctx = await requireTenantContext();
  if (!isPlacesConfigured())
    return { error: "Google Places is not configured." };

  const supabase = await createClient();
  const { data: site } = await supabase
    .from("sites")
    .select("content, lead_id")
    .eq("id", siteId)
    .maybeSingle();
  if (!site) return { error: "Site not found." };

  let placeId =
    ((site as any).content?.source?.placeId as string | undefined) ?? null;
  if (!placeId && (site as any).lead_id) {
    const { data: lead } = await supabase
      .from("leads")
      .select("place_id")
      .eq("id", (site as any).lead_id)
      .maybeSingle();
    placeId = (lead as any)?.place_id ?? null;
  }
  if (!placeId) return { error: "No Google listing is linked to this site." };

  try {
    const d = await getPlaceDetails(placeId);
    if (!d.photoNames.length)
      return { error: "This business has no photos on Google." };
    const urls = await importPlacePhotos(ctx.tenantId, siteId, d.photoNames, 6);
    if (!urls.length) return { error: "Could not download photos from Google." };
    return { urls };
  } catch {
    return { error: "Photo import failed. Try again in a moment." };
  }
}

export async function deleteSite(siteId: string): Promise<void> {
  await requireTenantContext();
  const supabase = await createClient();
  await supabase.from("sites").delete().eq("id", siteId);
  revalidatePath("/dashboard/sites");
  redirect("/dashboard/sites");
}
