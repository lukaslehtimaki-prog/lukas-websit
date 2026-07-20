"use server";

import { revalidatePath } from "next/cache";
import { requireTenantContext } from "@/lib/auth/tenant";
import { createClient } from "@/lib/supabase/server";
import { isPlacesConfigured } from "@/lib/env";
import {
  searchPlaces,
  geocodeLocation,
  PlacesError,
  type PlaceCandidate,
} from "@/lib/places/client";
import { enrichBatch, isOpportunity } from "@/lib/leads/matching";
import { checkLimit, recordUsage } from "@/lib/usage";

// The "every business type" sweep fans one search out across the local trades
// and services most likely to lack a website. Each entry is one Text Search
// query (1 page / 20 results) — worldwide English queries work fine.
const SWEEP_CATEGORIES = [
  // Trades & construction
  "plumber",
  "electrician",
  "construction company",
  "roofing contractor",
  "painter decorator",
  "carpenter",
  "flooring and tiling contractor",
  "welding and metalwork",
  "handyman service",
  // Auto
  "car repair shop",
  "car detailing and body shop",
  "tyre service",
  // Home services
  "heating and air conditioning",
  "cleaning service",
  "window cleaning",
  "moving company",
  "landscaping and gardening",
  "tree service",
  "pest control",
  "locksmith",
  "appliance repair",
  // Beauty & wellness
  "barber shop",
  "beauty salon",
  "nail salon",
  "massage therapist",
  "physiotherapy",
  "tattoo studio",
  // Pets
  "veterinary clinic",
  "pet grooming",
  // Food & local
  "restaurant",
  "cafe bakery",
  "florist",
  "catering service",
  "photographer",
] as const;

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
  const allTypes = formData.get("allTypes") === "on";
  const onlyOpportunities = formData.get("onlyOpportunities") === "on";
  // Quick-pick niches (comma-separated) run as a mini fan-out search.
  const pickedNiches = String(formData.get("niches") ?? "")
    .split(",")
    .map((n) => n.trim())
    .filter(Boolean)
    .slice(0, 20);
  const usingChips = pickedNiches.length > 0;
  if (!niche && !allTypes && !usingChips)
    return { error: "Pick a niche or enter a business type to search for." };
  if ((allTypes || usingChips) && !location)
    return { error: "Choosing niches needs a location to search in." };

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
          ? "Your workspace has no active plan. Subscribe from Billing to run searches."
          : `You've used all ${limit.limit} searches on your plan this month.`,
    };
  }

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

  const geoOpts = { lat, lng, radiusMeters: radiusKm * 1000 };
  const categories = allTypes
    ? [...SWEEP_CATEGORIES]
    : usingChips
      ? pickedNiches
      : [];
  const fanOut = categories.length > 0;
  const queries = fanOut
    ? categories.map((c) => `${c} in ${location}`)
    : [[niche, location].filter(Boolean).join(" in ")];

  let candidates: PlaceCandidate[];
  try {
    if (fanOut) {
      // Fan out, dedupe by place id (a garage can match two categories).
      const batches = await Promise.all(
        queries.map((query) =>
          searchPlaces({ query, ...geoOpts, maxResults: 20 }).catch(() => []),
        ),
      );
      const seen = new Map<string, PlaceCandidate>();
      for (const batch of batches)
        for (const c of batch) if (!seen.has(c.placeId)) seen.set(c.placeId, c);
      candidates = [...seen.values()];
    } else {
      candidates = await searchPlaces({
        query: queries[0],
        ...geoOpts,
        maxResults: 60,
      });
    }
  } catch (e) {
    return {
      error:
        e instanceof PlacesError
          ? e.message
          : "Places search failed. Check the API key and that 'Places API (New)' is enabled.",
    };
  }

  let enriched = await enrichBatch(candidates);
  if (onlyOpportunities)
    enriched = enriched.filter((l) => isOpportunity(l.websiteStatus));

  const supabase = await createClient();
  const { data: searchRow } = await supabase
    .from("searches")
    .insert({
      tenant_id: ctx.tenantId,
      created_by: ctx.userId,
      niche: allTypes
        ? "All business types"
        : usingChips
          ? pickedNiches.join(", ")
          : niche,
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
    let { error } = await supabase
      .from("leads")
      .upsert(rows, { onConflict: "tenant_id,place_id" });
    if (error && /website_status/.test(error.message)) {
      // Migration 0007 not applied yet: degrade the new statuses to the legacy
      // set so the search still saves (social/dead are opportunities).
      const legacy = rows.map((r) => ({
        ...r,
        website_status:
          r.website_status === "has_website" ? "has_website" : "no_website",
      }));
      ({ error } = await supabase
        .from("leads")
        .upsert(legacy, { onConflict: "tenant_id,place_id" }));
    }
    if (error) return { error: `Could not save leads: ${error.message}` };
  }

  await recordUsage(ctx.tenantId, ctx.userId, "lead_search", queries.length, {
    niche: allTypes ? "all_types_sweep" : usingChips ? "quick_pick" : niche,
    location: label,
    results: enriched.length,
  });
  revalidatePath("/dashboard/leads");

  const counts = { no_website: 0, social_only: 0, dead_site: 0 } as Record<
    string,
    number
  >;
  for (const l of enriched)
    if (l.websiteStatus in counts) counts[l.websiteStatus]++;
  const parts = [
    `${counts.no_website} with no website`,
    counts.social_only ? `${counts.social_only} social-media only` : null,
    counts.dead_site ? `${counts.dead_site} with a dead site` : null,
  ].filter(Boolean);
  return {
    ok: true,
    count: enriched.length,
    message: `Found ${enriched.length} businesses — ${parts.join(", ")}.`,
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
