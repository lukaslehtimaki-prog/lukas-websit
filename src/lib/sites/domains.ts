import "server-only";

// Custom domains for published sites. The domain is attached to this Vercel
// project via the Vercel API (so Vercel routes it here and issues TLS), then
// the proxy maps the incoming hostname back to the site it belongs to.
//
// Connect-only: the domain owner still points DNS at Vercel — we surface the
// exact records they need.

const VERCEL_API = "https://api.vercel.com";
// Not secrets — just identifiers for this project/team.
const PROJECT_ID = "prj_bwjVl840fkCcTt3EU4TN6i5yBjyz";
const TEAM_ID = "team_5VCv5F8oL0bRkJ75tzSyyr7R";

/** Vercel's anycast target for apex domains, and the CNAME for subdomains. */
export const APEX_A_RECORD = "216.198.79.1";
export const SUBDOMAIN_CNAME = "cname.vercel-dns.com";

export type DnsRecord = { type: string; name: string; value: string };

export function isDomainsConfigured(): boolean {
  return Boolean(process.env.VERCEL_API_TOKEN);
}

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.VERCEL_API_TOKEN ?? ""}`,
    "Content-Type": "application/json",
  };
}

const HOST_RE = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/;

/** Accepts "https://Example.com/path" or "example.com" → "example.com". */
export function normalizeDomain(input: string): string | null {
  let host = input.trim().toLowerCase();
  host = host.replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/:\d+$/, "");
  if (!host || host.length > 253) return null;
  if (!HOST_RE.test(host)) return null;
  // Reject our own hosts so a site can't hijack the app.
  if (host === "sitagio.com" || host.endsWith(".sitagio.com")) return null;
  if (host.endsWith(".vercel.app")) return null;
  return host;
}

/** True for an apex/registrable domain (example.com) vs a subdomain. */
export function isApex(host: string): boolean {
  const parts = host.split(".");
  if (parts.length <= 2) return true;
  // Handle common two-part public suffixes (co.uk, com.au, …).
  const twoPartTld = /^(co|com|org|net|gov|ac|edu)\.[a-z]{2}$/.test(
    parts.slice(-2).join("."),
  );
  return twoPartTld && parts.length === 3;
}

/** The DNS records the domain owner must create. */
export function dnsRecordsFor(host: string): DnsRecord[] {
  if (isApex(host)) {
    return [{ type: "A", name: "@", value: APEX_A_RECORD }];
  }
  const sub = host.split(".")[0];
  return [{ type: "CNAME", name: sub, value: SUBDOMAIN_CNAME }];
}

/** Attach the domain to the Vercel project. Idempotent-ish: already-added is OK. */
export async function addProjectDomain(
  host: string,
): Promise<{ ok: true } | { error: string }> {
  if (!isDomainsConfigured()) return { error: "Domains are not configured (VERCEL_API_TOKEN)." };
  try {
    const res = await fetch(
      `${VERCEL_API}/v10/projects/${PROJECT_ID}/domains?teamId=${TEAM_ID}`,
      { method: "POST", headers: authHeaders(), body: JSON.stringify({ name: host }) },
    );
    if (res.ok) return { ok: true };
    const body = (await res.json().catch(() => ({}))) as {
      error?: { code?: string; message?: string };
    };
    const code = body.error?.code ?? "";
    // Already attached to this project — treat as success.
    if (code === "domain_already_in_use" || code === "domain_already_exists") {
      const owned = await getProjectDomain(host);
      if (owned) return { ok: true };
      return {
        error:
          "That domain is already used by another Vercel project or account. Remove it there first.",
      };
    }
    return { error: body.error?.message ?? `Could not add the domain (${res.status}).` };
  } catch {
    return { error: "Could not reach Vercel. Try again in a moment." };
  }
}

async function getProjectDomain(
  host: string,
): Promise<{ verified: boolean } | null> {
  try {
    const res = await fetch(
      `${VERCEL_API}/v9/projects/${PROJECT_ID}/domains/${encodeURIComponent(host)}?teamId=${TEAM_ID}`,
      { headers: authHeaders(), cache: "no-store" },
    );
    if (!res.ok) return null;
    const body = (await res.json()) as { verified?: boolean };
    return { verified: Boolean(body.verified) };
  } catch {
    return null;
  }
}

/** Is DNS pointed at us yet? misconfigured=false means it resolves correctly. */
export async function getDomainStatus(
  host: string,
): Promise<{ attached: boolean; live: boolean }> {
  const attached = await getProjectDomain(host);
  if (!attached) return { attached: false, live: false };
  try {
    const res = await fetch(
      `${VERCEL_API}/v6/domains/${encodeURIComponent(host)}/config?teamId=${TEAM_ID}`,
      { headers: authHeaders(), cache: "no-store" },
    );
    if (!res.ok) return { attached: true, live: false };
    const body = (await res.json()) as { misconfigured?: boolean };
    return { attached: true, live: body.misconfigured === false };
  } catch {
    return { attached: true, live: false };
  }
}

export async function removeProjectDomain(host: string): Promise<void> {
  if (!isDomainsConfigured()) return;
  await fetch(
    `${VERCEL_API}/v9/projects/${PROJECT_ID}/domains/${encodeURIComponent(host)}?teamId=${TEAM_ID}`,
    { method: "DELETE", headers: authHeaders() },
  ).catch(() => {});
}
