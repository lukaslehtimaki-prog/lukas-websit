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

/** Sensible starter membership tiers (in Finnish) for a gym / studio. Editable later. */
export function defaultMembershipPlans(): MembershipPlan[] {
  return [
    {
      name: "Perus",
      price: "29,90 €",
      period: "/kk",
      features: ["Kuntosalin vapaa käyttö", "Pukukaappi ja suihkut", "Ei liittymismaksua"],
    },
    {
      name: "Premium",
      price: "49,90 €",
      period: "/kk",
      features: [
        "Kaikki Perus-edut",
        "Ryhmäliikuntatunnit",
        "Personal trainer -alennus",
        "Solarium",
      ],
      highlight: true,
    },
    {
      name: "Vuosijäsen",
      price: "399 €",
      period: "/vuosi",
      features: ["Kaikki Premium-edut", "2 kuukautta ilmaiseksi", "Kaverietu"],
    },
  ];
}
