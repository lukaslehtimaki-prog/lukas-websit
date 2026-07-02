"use server";

import { revalidatePath } from "next/cache";
import { requireTenantContext } from "@/lib/auth/tenant";
import { createClient } from "@/lib/supabase/server";
import { isPlacesConfigured } from "@/lib/env";
import { searchPlaces, geocodeLocation, PlacesError } from "@/lib/places/client";
import { enrichBatch } from "@/lib/leads/matching";
import { checkLimit, recordUsage } from "@/lib/usage";

export type SearchState = {
  ok?: boolean;
  error?: string;
  message?: string;
  count?: number;
};

function asDate(s: string | null): string | null {
  return s && /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : null;
}

export async function runSearchAction(
  _prev: SearchState,
  formData: FormData,
): Promise<SearchState> {
  const ctx = await requireTenantContext();

  if (!isPlacesConfigured()) {
    return {
      error:
        "Google Places isn't configured yet. Add GOOGLE_MAPS_API_KEY to .env.local (see README → Setup).",
    };
  }

  const niche = String(formData.get("niche") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const radiusKm = Number(formData.get("radiusKm") ?? "5") || 5;
  if (!niche) return { error: "Enter a niche or business type to search for." };

  const limit = await checkLimit(
    ctx.planId,
    ctx.subscriptionStatus,
    ctx.isPlatformAdmin,
    "lead_search",
  );
  if (!limit.allowed) {
    return {
      error:
        limit.limit === 0
          ? "Your workspace has no active plan. Start your 7-day free trial from Billing to run searches."
          : `You've used all ${limit.limit} searches on your plan this month.`,
    };
  }

  const query = [niche, location].filter(Boolean).join(" in ");
  let lat: number | null = null;
  let lng: number | null = null;
  let label = location;
  if (location) {
    const geo = await geocodeLocation(location);
    if (geo) {
      lat = geo.lat;
      lng = geo.lng;
      label = geo.label;
    }
  }

  let candidates;
  try {
    candidates = await searchPlaces({
      query,
      lat,
      lng,
      radiusMeters: radiusKm * 1000,
      maxResults: 40,
    });
  } catch (e) {
    return {
      error:
        e instanceof PlacesError
          ? e.message
          : "Places search failed. Check the API key and that 'Places API (New)' is enabled.",
    };
  }

  const enriched = await enrichBatch(candidates);

  const supabase = await createClient();
  const { data: searchRow } = await supabase
    .from("searches")
    .insert({
      tenant_id: ctx.tenantId,
      created_by: ctx.userId,
      niche,
      location_label: label || null,
      lat,
      lng,
      radius_m: Math.round(radiusKm * 1000),
      status: "complete",
      result_count: enriched.length,
    })
    .select("id")
    .single();

  const searchId = (searchRow as { id?: string } | null)?.id ?? null;

  if (enriched.length) {
    const rows = enriched.map((l) => ({
      tenant_id: ctx.tenantId,
      search_id: searchId,
      source: "google_places",
      place_id: l.placeId,
      name: l.name,
      address: l.address,
      category: l.category,
      website: l.website,
      website_status: l.websiteStatus,
      lat: l.lat,
      lng: l.lng,
      business_id: l.businessId,
      registry_status: l.registryStatus,
      registry_name: l.registryName,
      registry_registration_date: asDate(l.registryRegistrationDate),
      registry_industry_code: l.registryIndustryCode,
    }));
    const { error } = await supabase
      .from("leads")
      .upsert(rows, { onConflict: "tenant_id,place_id" });
    if (error) return { error: `Could not save leads: ${error.message}` };
  }

  await recordUsage(ctx.tenantId, ctx.userId, "lead_search", 1, {
    niche,
    location: label,
    results: enriched.length,
  });
  revalidatePath("/dashboard/leads");

  const noWeb = enriched.filter((l) => l.websiteStatus === "no_website").length;
  return {
    ok: true,
    count: enriched.length,
    message: `Found ${enriched.length} businesses — ${noWeb} with no website.`,
  };
}

export async function updateLeadStatus(
  leadId: string,
  status: string,
): Promise<void> {
  await requireTenantContext();
  const supabase = await createClient();
  await supabase
    .from("leads")
    .update({ crm_status: status, updated_at: new Date().toISOString() })
    .eq("id", leadId);
  revalidatePath("/dashboard/leads");
}

export async function deleteLead(leadId: string): Promise<void> {
  await requireTenantContext();
  const supabase = await createClient();
  await supabase.from("leads").delete().eq("id", leadId);
  revalidatePath("/dashboard/leads");
}
