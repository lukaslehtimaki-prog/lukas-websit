import { t } from "./i18n";
import type { MembershipPlan, SiteKind } from "./types";

// Infer which extra section a site should get from the business category / template.
// Matching is on lowercased category + name, covering common Finnish + English terms.

const MEMBERSHIP = [
  "gym",
  "fitness",
  "kuntosali",
  "crossfit",
  "yoga",
  "jooga",
  "pilates",
  "kamppailu",
  "martial",
  "climbing",
  "kiipeily",
  "dance studio",
  "tanssi",
];

const BOOKING = [
  "barber",
  "parturi",
  "hair",
  "kampaamo",
  "kampaaja",
  "beauty",
  "kauneus",
  "nail",
  "kynsi",
  "massage",
  "hieronta",
  "spa",
  "salon",
  "tattoo",
  "tatuointi",
  "physio",
  "fysio",
  "hammas",
  "dental",
  "klinikka",
  "clinic",
];

export function inferSiteKind(
  category: string | null | undefined,
  templateId: string,
  name?: string | null,
): SiteKind {
  const hay = `${category ?? ""} ${name ?? ""}`.toLowerCase();
  if (MEMBERSHIP.some((k) => hay.includes(k))) return "membership";
  if (BOOKING.some((k) => hay.includes(k))) return "booking";
  // Salon template businesses are appointment-based by default.
  if (templateId === "salon") return "booking";
  return "standard";
}

/** Sensible starter membership tiers for a gym / studio, in the site's language. */
export function defaultMembershipPlans(language?: string): MembershipPlan[] {
  const s = t(language ?? "en");
  return [
    {
      name: s.planBasic,
      price: "29,90 €",
      period: s.perMonth,
      features: [s.ftAccess, s.ftLockers, s.ftNoJoinFee],
    },
    {
      name: s.planPremium,
      price: "49,90 €",
      period: s.perMonth,
      features: [s.ftAllBasic, s.ftGroupClasses, s.ftPtDiscount],
      highlight: true,
    },
    {
      name: s.planAnnual,
      price: "399 €",
      period: s.perYear,
      features: [s.ftAllPremium, s.ftTwoMonthsFree],
    },
  ];
}
