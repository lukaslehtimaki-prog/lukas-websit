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

// ─── Deep website discovery ───────────────────────────────────────────────
// Google often lacks a business's website even when they own the obvious
// domain. For "no website" candidates we guess likely domains from the name,
// fetch them, and only reclassify as "has website" when the page actually
// mentions the business — a conservative check that never turns a real
// opportunity into a false positive, only removes them.

// Country name (any of several languages, as it appears at the end of a Google
// formatted address) → ccTLD, used to guess a local domain.
const CCTLD_BY_COUNTRY: Record<string, string> = {
  finland: "fi", suomi: "fi",
  sweden: "se", sverige: "se",
  norway: "no", norge: "no",
  denmark: "dk", danmark: "dk",
  germany: "de", deutschland: "de",
  france: "fr",
  spain: "es", españa: "es",
  italy: "it", italia: "it",
  netherlands: "nl", nederland: "nl",
  belgium: "be", belgië: "be", belgique: "be",
  portugal: "pt",
  austria: "at", österreich: "at",
  switzerland: "ch", schweiz: "ch", suisse: "ch",
  ireland: "ie",
  poland: "pl", polska: "pl",
  estonia: "ee", eesti: "ee",
};

function tldFromAddress(address: string | null | undefined): string | null {
  if (!address) return null;
  const last = address.split(",").pop()?.trim().toLowerCase() ?? "";
  return CCTLD_BY_COUNTRY[last] ?? null;
}

const GENERIC_TOKENS = new Set([
  "the", "and", "oy", "ab", "ltd", "inc", "co", "shop", "store", "salon",
  "cafe", "bar", "studio", "clinic", "center", "centre", "group", "services",
  "service", "company", "restaurant", "hair", "beauty", "auto", "car",
]);

/** Alphanumeric-only slug of the name, company suffixes stripped. */
function domainSlug(name: string): string {
  return normalize(name).replace(/[^a-z0-9]/g, "");
}

/** Distinctive lowercase name tokens (>=4 chars, not generic). */
function distinctiveTokens(name: string): string[] {
  return normalize(name)
    .split(" ")
    .filter((tk) => tk.length >= 4 && !GENERIC_TOKENS.has(tk));
}

function candidateDomains(name: string, address: string | null): string[] {
  const slug = domainSlug(name);
  if (slug.length < 6) return []; // too generic → skip (false-positive risk)
  const hyph = normalize(name).replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const tlds = ["com"];
  const cc = tldFromAddress(address);
  if (cc && !tlds.includes(cc)) tlds.unshift(cc); // prefer local TLD first
  const hosts = new Set<string>();
  for (const tld of tlds) {
    hosts.add(`${slug}.${tld}`);
    if (hyph !== slug) hosts.add(`${hyph}.${tld}`);
  }
  return [...hosts].slice(0, 4);
}

/** Does the fetched page clearly belong to this business? */
function pageMatchesBusiness(name: string, html: string): boolean {
  const body = html.toLowerCase();
  const collapsed = body.replace(/[^a-z0-9]/g, "");
  if (collapsed.includes(domainSlug(name))) return true; // full name present
  const tokens = distinctiveTokens(name);
  if (!tokens.length) return false;
  const present = tokens.filter((tk) => body.includes(tk));
  // Require every distinctive token (2+ names) or the sole distinctive token.
  return present.length === tokens.length;
}

/** Fetch a guessed domain and confirm it belongs to the business. */
async function findOwnWebsite(
  name: string,
  address: string | null,
): Promise<string | null> {
  for (const host of candidateDomains(name, address)) {
    const url = `https://${host}`;
    if (!isProbeSafe(url)) continue;
    try {
      const res = await fetch(url, {
        redirect: "follow",
        signal: AbortSignal.timeout(4500),
        cache: "no-store",
        headers: { "user-agent": "Mozilla/5.0 (compatible; SitovaiBot/1.0)" },
      });
      if (!res.ok) continue;
      if (res.url && isSocialOrDirectoryUrl(res.url)) continue;
      const html = (await res.text()).slice(0, 60000);
      if (pageMatchesBusiness(name, html)) return res.url || url;
    } catch {
      // unreachable guess — try the next candidate
    }
  }
  return null;
}

/**
 * For "no website" candidates, try to discover an owned domain. Returns a map
 * of placeId → confirmed website URL. Capped so large sweeps stay responsive.
 */
export async function findOwnWebsites(
  candidates: PlaceCandidate[],
  concurrency = 10,
  cap = 50,
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const list = candidates.slice(0, cap);
  let next = 0;
  async function worker() {
    while (next < list.length) {
      const c = list[next++];
      const found = await findOwnWebsite(c.name, c.address);
      if (found) out.set(c.placeId, found);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, list.length) }, worker),
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
  websiteOverride?: string | null,
): Promise<EnrichedLead> {
  const website = websiteOverride ?? candidate.website;
  const lead: EnrichedLead = {
    ...candidate,
    website,
    hasWebsite: Boolean(website),
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
  // Deep pass: for "no website" candidates, try to discover an owned domain
  // Google didn't list. Confirmed hits become "has website" and drop out of
  // the opportunity list, cutting false positives.
  const noWebsite = candidates.filter(
    (c) => websiteStatuses.get(c.placeId) === "no_website",
  );
  const discovered = await findOwnWebsites(noWebsite);

  const out: EnrichedLead[] = new Array(candidates.length);
  let next = 0;
  async function worker() {
    while (next < candidates.length) {
      const idx = next++;
      const c = candidates[idx];
      const found = discovered.get(c.placeId);
      const status = found
        ? "has_website"
        : (websiteStatuses.get(c.placeId) ??
          (c.hasWebsite ? "has_website" : "no_website"));
      out[idx] = await enrichWithRegistry(c, status, found ?? undefined);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, candidates.length) }, worker),
  );
  return out;
}
