/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";

// =============================================================================
// PRH "YTJ" open-data client (Finnish Business Information System).
//
//   • Free, no API key, updated once daily.
//   • Excludes sole traders (toiminimi); contains no email/phone.
//   • v3 endpoint: https://avoindata.prh.fi/opendata-ytj-api/v3/companies?name=...
//
// The v3 JSON shape can shift, so parsing here is intentionally defensive: anything we
// can't read degrades to null / no_match rather than throwing. This is one of the modules
// flagged for likely independent rework (matching accuracy / field mapping).
// =============================================================================

const YTJ_BASE = "https://avoindata.prh.fi/opendata-ytj-api/v3";

export type RegistryCompany = {
  businessId: string;
  name: string;
  registrationDate: string | null;
  industryCode: string | null;
  industryLabel: string | null;
  city: string | null;
  postCode: string | null;
};

function pickFiDescription(descriptions: any): string | null {
  if (!Array.isArray(descriptions)) return null;
  const fi = descriptions.find(
    (d: any) => d?.languageCode === "fi" || d?.language === "fi" || d?.languageCode === "1",
  );
  return (fi ?? descriptions[0])?.description ?? null;
}

function pickCity(addr: any): string | null {
  if (!addr) return null;
  if (Array.isArray(addr.postOffices)) {
    const fi = addr.postOffices.find(
      (p: any) => p?.languageCode === "fi" || p?.language === "fi",
    );
    return (fi ?? addr.postOffices[0])?.city ?? null;
  }
  return addr.city ?? addr.postOffice ?? null;
}

function parseCompany(raw: any): RegistryCompany | null {
  if (!raw || typeof raw !== "object") return null;

  // businessId may be an object { value, registrationDate } or a plain string.
  const bidRaw = raw.businessId;
  const businessId =
    typeof bidRaw === "object" ? bidRaw?.value : (bidRaw ?? raw.business_id);
  if (!businessId) return null;
  const registrationDate =
    (typeof bidRaw === "object" ? bidRaw?.registrationDate : null) ??
    raw.registrationDate ??
    null;

  const names = Array.isArray(raw.names) ? raw.names : [];
  const name =
    names.find((n: any) => !n?.endDate)?.name ??
    names[0]?.name ??
    raw.name ??
    "";

  const mbl = raw.mainBusinessLine ?? {};
  const industryCode = mbl.type ?? mbl.code ?? null;
  const industryLabel = pickFiDescription(mbl.descriptions);

  const addr = (Array.isArray(raw.addresses) ? raw.addresses : [])[0] ?? {};
  const city = pickCity(addr);
  const postCode = addr.postCode ?? addr.postcode ?? null;

  return {
    businessId: String(businessId),
    name: String(name || ""),
    registrationDate: registrationDate ? String(registrationDate) : null,
    industryCode: industryCode != null ? String(industryCode) : null,
    industryLabel: industryLabel ?? null,
    city: city ? String(city) : null,
    postCode: postCode ? String(postCode) : null,
  };
}

export async function searchRegistryByName(
  name: string,
): Promise<RegistryCompany[]> {
  const q = name.trim();
  if (!q) return [];

  const url = new URL(`${YTJ_BASE}/companies`);
  url.searchParams.set("name", q);

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
  } catch {
    return [];
  }
  if (!res.ok) return [];

  let json: any;
  try {
    json = await res.json();
  } catch {
    return [];
  }

  const companies = json?.companies ?? json?.results ?? [];
  if (!Array.isArray(companies)) return [];
  return companies
    .map(parseCompany)
    .filter((c: RegistryCompany | null): c is RegistryCompany => c !== null);
}
