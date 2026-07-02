import "server-only";
import { searchRegistryByName, type RegistryCompany } from "@/lib/ytj/client";
import type { PlaceCandidate } from "@/lib/places/client";

// Cross-references Google Places results with the PRH/YTJ registry by company name
// (boosted when the registry city/postcode also appears in the Places address).

export type RegistryStatus =
  | "matched"
  | "low_confidence"
  | "no_match"
  | "unchecked";

export type EnrichedLead = PlaceCandidate & {
  websiteStatus: "no_website" | "has_website";
  registryStatus: RegistryStatus;
  businessId: string | null;
  registryName: string | null;
  registryRegistrationDate: string | null;
  registryIndustryCode: string | null;
};

const COMPANY_SUFFIXES = /\b(oyj|oy|ab|ky|tmi|ry|osk)\b/g;

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(COMPANY_SUFFIXES, "")
    .replace(/[^a-z0-9äöå ]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Jaccard-ish token overlap between two business names (0..1). */
function nameSimilarity(a: string, b: string): number {
  const A = new Set(normalize(a).split(" ").filter(Boolean));
  const B = new Set(normalize(b).split(" ").filter(Boolean));
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  return inter / Math.max(A.size, B.size);
}

function pickBest(candidate: PlaceCandidate, companies: RegistryCompany[]) {
  const addr = (candidate.address ?? "").toLowerCase();
  let best: { company: RegistryCompany; score: number } | null = null;
  for (const company of companies) {
    let score = nameSimilarity(candidate.name, company.name);
    if (company.city && addr.includes(company.city.toLowerCase())) score += 0.2;
    if (company.postCode && addr.includes(company.postCode)) score += 0.15;
    score = Math.min(1, score);
    if (!best || score > best.score) best = { company, score };
  }
  return best && best.score >= 0.3 ? best : null;
}

export async function enrichWithRegistry(
  candidate: PlaceCandidate,
): Promise<EnrichedLead> {
  const lead: EnrichedLead = {
    ...candidate,
    websiteStatus: candidate.hasWebsite ? "has_website" : "no_website",
    registryStatus: "no_match",
    businessId: null,
    registryName: null,
    registryRegistrationDate: null,
    registryIndustryCode: null,
  };

  try {
    const companies = await searchRegistryByName(candidate.name);
    const best = pickBest(candidate, companies);
    if (best) {
      lead.registryStatus = best.score >= 0.6 ? "matched" : "low_confidence";
      lead.businessId = best.company.businessId;
      lead.registryName = best.company.name;
      lead.registryRegistrationDate = best.company.registrationDate;
      lead.registryIndustryCode = best.company.industryCode;
    }
  } catch {
    lead.registryStatus = "unchecked";
  }

  return lead;
}

/** Enrich many candidates with bounded concurrency to be gentle on the PRH API. */
export async function enrichBatch(
  candidates: PlaceCandidate[],
  concurrency = 4,
): Promise<EnrichedLead[]> {
  const out: EnrichedLead[] = new Array(candidates.length);
  let next = 0;
  async function worker() {
    while (next < candidates.length) {
      const idx = next++;
      out[idx] = await enrichWithRegistry(candidates[idx]);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, candidates.length) }, worker),
  );
  return out;
}
