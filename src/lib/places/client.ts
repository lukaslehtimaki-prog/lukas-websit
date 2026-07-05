import "server-only";
import { env, isPlacesConfigured } from "@/lib/env";

// =============================================================================
// Google Places API (New) client — COST-OPTIMIZED.
//
//  • Text Search requests ONLY Pro-tier fields (incl. websiteUri, which gives us the
//    "no website" signal). It deliberately does NOT request phone / opening hours, which
//    are Enterprise-tier fields — those would make every search the pricier Enterprise SKU.
//  • Place Details (with phone / hours / photos) is fetched ON DEMAND for a single chosen
//    lead, so the Enterprise cost is paid per-lead-you-act-on, not per-result-found.
//
// Billing is per request (each page of up to 20 results = 1 billable Text Search event).
// Verify current pricing at https://developers.google.com/maps/billing-and-pricing/pricing
// =============================================================================

const PLACES_BASE = "https://places.googleapis.com/v1";

export type PlaceCandidate = {
  placeId: string;
  name: string;
  address: string | null;
  website: string | null;
  hasWebsite: boolean;
  category: string | null;
  lat: number | null;
  lng: number | null;
};

export type PlaceReview = {
  author: string;
  rating: number;
  text: string;
  relativeTime: string | null;
};

export type PlaceDetails = PlaceCandidate & {
  phone: string | null;
  openingHours: string[] | null;
  rating: number | null;
  photoNames: string[];
  reviews: PlaceReview[];
};

export class PlacesError extends Error {}

type GooglePlace = {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  websiteUri?: string;
  location?: { latitude?: number; longitude?: number };
  primaryTypeDisplayName?: { text?: string };
  types?: string[];
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  regularOpeningHours?: { weekdayDescriptions?: string[] };
  rating?: number;
  photos?: { name?: string }[];
  reviews?: {
    rating?: number;
    text?: { text?: string };
    originalText?: { text?: string };
    authorAttribution?: { displayName?: string };
    relativePublishTimeDescription?: string;
  }[];
};

// Pro-tier field mask for Text Search (websiteUri => no-website detection).
const TEXT_SEARCH_FIELDS = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.websiteUri",
  "places.location",
  "places.primaryTypeDisplayName",
  "places.types",
  "nextPageToken",
].join(",");

// Includes Enterprise + Atmosphere-tier fields (phone, hours, reviews) — on-demand
// only, fetched once per site build (a deliberate, plan-limited action).
const DETAILS_FIELDS = [
  "id",
  "displayName",
  "formattedAddress",
  "websiteUri",
  "location",
  "primaryTypeDisplayName",
  "types",
  "nationalPhoneNumber",
  "internationalPhoneNumber",
  "regularOpeningHours",
  "rating",
  "photos",
  "reviews",
].join(",");

function toCandidate(p: GooglePlace): PlaceCandidate {
  const website = p.websiteUri ?? null;
  return {
    placeId: p.id,
    name: p.displayName?.text ?? "(unnamed)",
    address: p.formattedAddress ?? null,
    website,
    hasWebsite: Boolean(website),
    category: p.primaryTypeDisplayName?.text ?? p.types?.[0] ?? null,
    lat: p.location?.latitude ?? null,
    lng: p.location?.longitude ?? null,
  };
}

export async function searchPlaces(opts: {
  query: string;
  lat?: number | null;
  lng?: number | null;
  radiusMeters?: number;
  maxResults?: number; // up to 60 (3 pages of 20)
}): Promise<PlaceCandidate[]> {
  if (!isPlacesConfigured()) {
    throw new PlacesError(
      "Google Places API key is not set (GOOGLE_MAPS_API_KEY). See README → Setup.",
    );
  }
  const maxResults = Math.min(opts.maxResults ?? 20, 60);
  const results: PlaceCandidate[] = [];
  let pageToken: string | undefined;

  do {
    const body: Record<string, unknown> = {
      textQuery: opts.query,
      regionCode: "FI",
      languageCode: "fi",
      pageSize: 20,
    };
    if (opts.lat != null && opts.lng != null) {
      body.locationBias = {
        circle: {
          center: { latitude: opts.lat, longitude: opts.lng },
          radius: Math.min(Math.max(opts.radiusMeters ?? 5000, 1), 50000),
        },
      };
    }
    if (pageToken) body.pageToken = pageToken;

    const res = await fetch(`${PLACES_BASE}/places:searchText`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": env.GOOGLE_MAPS_API_KEY,
        "X-Goog-FieldMask": TEXT_SEARCH_FIELDS,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new PlacesError(
        `Places search failed (${res.status}): ${text.slice(0, 300)}`,
      );
    }

    const json = (await res.json()) as {
      places?: GooglePlace[];
      nextPageToken?: string;
    };
    for (const p of json.places ?? []) {
      results.push(toCandidate(p));
      if (results.length >= maxResults) break;
    }
    pageToken = results.length >= maxResults ? undefined : json.nextPageToken;
  } while (pageToken);

  return results;
}

export async function getPlaceDetails(placeId: string): Promise<PlaceDetails> {
  if (!isPlacesConfigured()) {
    throw new PlacesError("Google Places API key is not set (GOOGLE_MAPS_API_KEY).");
  }
  const res = await fetch(
    `${PLACES_BASE}/places/${encodeURIComponent(placeId)}`,
    {
      method: "GET",
      headers: {
        "X-Goog-Api-Key": env.GOOGLE_MAPS_API_KEY,
        "X-Goog-FieldMask": DETAILS_FIELDS,
      },
      cache: "no-store",
    },
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new PlacesError(
      `Place details failed (${res.status}): ${text.slice(0, 300)}`,
    );
  }
  const p = (await res.json()) as GooglePlace;
  return {
    ...toCandidate(p),
    phone: p.nationalPhoneNumber ?? p.internationalPhoneNumber ?? null,
    openingHours: p.regularOpeningHours?.weekdayDescriptions ?? null,
    rating: p.rating ?? null,
    photoNames: (p.photos ?? []).map((ph) => ph.name ?? "").filter(Boolean),
    reviews: parseReviews(p),
  };
}

/** Map Google review objects to our compact shape, dropping empty ones. */
function parseReviews(p: GooglePlace): PlaceReview[] {
  return (p.reviews ?? [])
    .map((rv) => ({
      author: rv.authorAttribution?.displayName?.trim() || "Google-käyttäjä",
      rating: typeof rv.rating === "number" ? rv.rating : 0,
      text: (rv.text?.text ?? rv.originalText?.text ?? "").trim(),
      relativeTime: rv.relativePublishTimeDescription ?? null,
    }))
    .filter((rv) => rv.text.length > 0);
}

/** Geocode a free-text location to coordinates so a radius bias can be applied. */
export async function geocodeLocation(
  location: string,
): Promise<{ lat: number; lng: number; label: string } | null> {
  if (!isPlacesConfigured() || !location.trim()) return null;
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", location);
  url.searchParams.set("region", "fi");
  url.searchParams.set("key", env.GOOGLE_MAPS_API_KEY);
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    results?: {
      geometry?: { location?: { lat: number; lng: number } };
      formatted_address?: string;
    }[];
  };
  const first = json.results?.[0];
  if (!first?.geometry?.location) return null;
  return {
    lat: first.geometry.location.lat,
    lng: first.geometry.location.lng,
    label: first.formatted_address ?? location,
  };
}

/** Pull an explicit place_id out of a Google Maps URL when present. */
export function extractPlaceIdFromUrl(input: string): string | null {
  const m = input.match(/[?&]place_id=([A-Za-z0-9_-]+)/);
  return m ? m[1] : null;
}

/**
 * Resolve a pasted Google Maps link OR free text into Place Details. Falls back to a
 * Text Search (top result) when no explicit place_id is present in the URL.
 */
export async function resolvePlace(input: string): Promise<PlaceDetails | null> {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const placeId = extractPlaceIdFromUrl(trimmed);
  if (placeId) {
    try {
      return await getPlaceDetails(placeId);
    } catch {
      // fall through to text search
    }
  }

  let query = trimmed;
  const placeSeg = trimmed.match(/\/place\/([^/@]+)/);
  if (placeSeg) query = decodeURIComponent(placeSeg[1].replace(/\+/g, " "));

  const [top] = await searchPlaces({ query, maxResults: 1 });
  if (!top) return null;
  try {
    return await getPlaceDetails(top.placeId);
  } catch {
    return {
      ...top,
      phone: null,
      openingHours: null,
      rating: null,
      photoNames: [],
      reviews: [],
    };
  }
}
