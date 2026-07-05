"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireTenantContext } from "@/lib/auth/tenant";
import { createClient } from "@/lib/supabase/server";
import { isAIConfigured, isPlacesConfigured } from "@/lib/env";
import { getPlaceDetails, resolvePlace } from "@/lib/places/client";
import { generateWebsiteContent, fallbackContent } from "@/lib/ai/website-content";
import {
  inferSiteKind,
  defaultMembershipPlans,
} from "@/lib/templates/site-kind";
import { uploadSiteImage } from "@/lib/sites/images";
import { checkLimit, recordUsage } from "@/lib/usage";
import type { BusinessInfo, SiteContent, SiteReview } from "@/lib/templates/types";

/** Tag the site with its business kind + starter data for the extra section. */
function applyKind(content: SiteContent, info: BusinessInfo, templateId: string) {
  content.kind = inferSiteKind(info.category, templateId, info.name);
  if (content.kind === "membership" && !content.membershipPlans?.length) {
    content.membershipPlans = defaultMembershipPlans();
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
): Promise<{ info: BusinessInfo; reviews: SiteReview[] }> {
  let phone: string | null = lead.phone ?? null;
  let hours: string[] | null = null;
  let address: string | null = lead.address ?? null;
  let category: string | null = lead.category ?? null;
  let website: string | null = lead.website ?? null;
  let reviews: SiteReview[] = [];

  // On-demand detail fetch (phone / hours / Google reviews) when building a site.
  if (lead.place_id) {
    try {
      const d = await getPlaceDetails(lead.place_id);
      phone = d.phone ?? phone;
      hours = d.openingHours;
      address = d.address ?? address;
      category = d.category ?? category;
      website = d.website ?? website;
      reviews = d.reviews;
      if (phone && phone !== lead.phone) {
        await supabase.from("leads").update({ phone }).eq("id", lead.id);
      }
    } catch {
      // best effort; fall back to whatever the lead already had
    }
  }

  const info: BusinessInfo = {
    name: lead.name,
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
  return { info, reviews };
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

  const { info, reviews } = await leadToBusinessInfo(supabase, lead);
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

  await recordUsage(ctx.tenantId, ctx.userId, "site_generation");
  revalidatePath("/dashboard/sites");
  redirect(`/dashboard/sites/${(site as any).id}`);
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

  await recordUsage(ctx.tenantId, ctx.userId, "site_generation");
  revalidatePath("/dashboard/sites");
  redirect(`/dashboard/sites/${(site as any).id}`);
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
    content = await generateWebsiteContent(source);
  } catch {
    return { error: "AI generation failed. Try again in a moment." };
  }
  // Preserve real reviews + the chosen design + kind across an AI copy refresh.
  if (existing?.reviews?.length) content.reviews = existing.reviews;
  if (existing?.designSeed != null) content.designSeed = existing.designSeed;
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

export async function deleteSite(siteId: string): Promise<void> {
  await requireTenantContext();
  const supabase = await createClient();
  await supabase.from("sites").delete().eq("id", siteId);
  revalidatePath("/dashboard/sites");
  redirect("/dashboard/sites");
}
