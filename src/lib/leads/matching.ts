import "server-only";
import { searchRegistryByName, type RegistryCompany } from "@/lib/ytj/client";
import {
  isSocialOrDirectoryUrl,
  type PlaceCandidate,
} from "@/lib/places/client";

// Cross-references Google Places results with the PRH/YTJ registry by company name
// (boosted when the registry city/postcode also appears in the Places address),
// and classifies each lead's web presence — including a live probe that catches
// dead/parked domains still listed on Google.

export type RegistryStatus =
  | "matched"
  | "low_confidence"
  | "no_match"
  | "unchecked";

/** no_website, social_only and dead_site are all sales opportunities. */
export type WebsiteStatus =
  | "no_website"
  | "social_only"
  | "dead_site"
  | "has_website";

export function isOpportunity(status: string): boolean {
  return status !== "has_website";
}

export type EnrichedLead = PlaceCandidate & {
  websiteStatus: WebsiteStatus;
  registryStatus: RegistryStatus;
  businessId: string | null;
  registryName: string | null;
  registryRegistrationDate: string | null;
  registryIndustryCode: string | null;
};

/**
 * SSRF guard: listing URLs originate from third-party data, so the probe must
 * never be steerable at internal services. Only plain http(s) to a public
 * hostname is allowed.
 */
function isProbeSafe(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    const host = u.hostname.toLowerCase();
    if (!host.includes(".")) return false; // bare hostnames (localhost, internal)
    if (
      /^(127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
      host.endsWith(".local") ||
      host.endsWith(".internal") ||
      host === "metadata.google.internal" ||
      host.startsWith("[") // IPv6 literals
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * GET the site with a short timeout. Any HTTP response (even 403/404) proves a
 * server exists; network errors / timeouts mean the listed site is dead. A
 * redirect that lands on a social platform counts as social-only.
 */
async function probeOnce(
  url: string,
  timeoutMs: number,
): Promise<"alive" | "dead" | "social" | "retry"> {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
      headers: { "user-agent": "Mozilla/5.0 (compatible; SitovaiBot/1.0)" },
    });
    if (res.url && isSocialOrDirectoryUrl(res.url)) return "social";
    // 5xx is often transient (overloaded/maintenance) — worth one retry before
    // calling a site dead. Any 2xx/3xx/4xx means a real server answered.
    return res.status >= 500 ? "retry" : "alive";
  } catch {
    // Network error or timeout — could be a slow site; retry before giving up.
    return "retry";
  }
}

async function probeWebsite(
  url: string,
): Promise<"alive" | "dead" | "social"> {
  if (!isProbeSafe(url)) return "dead";
  const first = await probeOnce(url, 5000);
  if (first !== "retry") return first;
  // Second attempt with a longer timeout; only now do we trust "dead".
  const second = await probeOnce(url, 8000);
  return second === "retry" ? "dead" : second;
}

/** Classify every candidate's web presence; probes real URLs concurrently. */
export async function classifyWebsites(
  candidates: PlaceCandidate[],
  concurrency = 10,
): Promise<Map<string, WebsiteStatus>> {
  const out = new Map<string, WebsiteStatus>();
  const toProbe: PlaceCandidate[] = [];
  for (const c of candidates) {
    if (!c.website) out.set(c.placeId, "no_website");
    else if (isSocialOrDirectoryUrl(c.website)) out.set(c.placeId, "social_only");
    else toProbe.push(c);
  }
  let next = 0;
  async function worker() {
    while (next < toProbe.length) {
      const c = toProbe[next++];
      const result = await probeWebsite(c.website!);
      out.set(
        c.placeId,
        result === "social"
          ? "social_only"
          : result === "dead"
            ? "dead_site"
            : "has_website",
      );
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, toProbe.length) }, worker),
  );
  return out;
}

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
  websiteStatus: WebsiteStatus,
): Promise<EnrichedLead> {
  const lead: EnrichedLead = {
    ...candidate,
    websiteStatus,
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
  const websiteStatuses = await classifyWebsites(candidates);
  const out: EnrichedLead[] = new Array(candidates.length);
  let next = 0;
  async function worker() {
    while (next < candidates.length) {
      const idx = next++;
      const c = candidates[idx];
      out[idx] = await enrichWithRegistry(
        c,
        websiteStatuses.get(c.placeId) ?? (c.hasWebsite ? "has_website" : "no_website"),
      );
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, candidates.length) }, worker),
  );
  return out;
}
