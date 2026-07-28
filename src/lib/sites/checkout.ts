import "server-only";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { PLATFORM_COMMISSION_PCT } from "@/lib/sites/connect";
import type { SiteContent } from "@/lib/templates/types";

// Auto-created Stripe Payment Links for selling a generated website through the
// pitch email. One Product per site (reused), a new Price + Payment Link when
// the asking price changes; superseded links are deactivated so an old email
// can't undercut a new offer.
//
// Money routing: the platform owner's own sales charge directly on the
// platform account. Everyone else needs Stripe Connect payouts — their sales
// become destination charges (money to their account, minus the platform
// commission which stays in the platform balance).

export type SitePayment = NonNullable<SiteContent["payment"]>;

/** "500 €" | "$490" | "499,99" → minor units + currency. Null if unparseable. */
export function parsePrice(
  input: string,
): { amount: number; currency: string } | null {
  const s = input.trim();
  if (!s) return null;
  const currency = s.includes("$")
    ? "usd"
    : s.includes("£")
      ? "gbp"
      : /\bkr\b/i.test(s)
        ? "sek"
        : "eur";
  const num = s.replace(/[^\d.,]/g, "");
  if (!num) return null;
  let normalized = num;
  if (num.includes(",") && num.includes(".")) {
    // Both separators: the later one is the decimal point.
    normalized =
      num.lastIndexOf(",") > num.lastIndexOf(".")
        ? num.replaceAll(".", "").replace(",", ".")
        : num.replaceAll(",", "");
  } else if (num.includes(",")) {
    const parts = num.split(",");
    // "499,99" is a decimal comma; "1,000" (3 digits) is a thousands separator.
    normalized =
      parts.length === 2 && parts[1].length !== 3
        ? num.replace(",", ".")
        : num.replaceAll(",", "");
  }
  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0 || value > 1_000_000) return null;
  return { amount: Math.round(value * 100), currency };
}

/**
 * Returns a payment link matching the asking price, reusing the stored one
 * when it already matches, creating (and persisting via the caller) otherwise.
 */
export async function ensureSitePaymentLink(opts: {
  siteId: string;
  tenantId: string;
  content: SiteContent;
  priceStr: string;
  liveUrl: string;
  /** Platform owner's own workspace: charge directly, no fee. */
  platformDirect: boolean;
  /** The seller's ready Connect account (required unless platformDirect). */
  connectAccountId?: string | null;
}): Promise<
  { payment: SitePayment; changed: boolean } | { error: string }
> {
  if (!isStripeConfigured())
    return { error: "Stripe is not configured (STRIPE_SECRET_KEY)." };
  const dest = opts.platformDirect ? null : (opts.connectAccountId ?? null);
  if (!opts.platformDirect && !dest)
    return {
      error:
        "Connect Stripe payouts in Settings to sell websites with the Buy button.",
    };
  const parsed = parsePrice(opts.priceStr);
  if (!parsed) return { error: "Enter a valid price (e.g. 500 €)." };

  const existing = opts.content.payment;
  if (
    existing?.link &&
    existing.amount === parsed.amount &&
    existing.currency === parsed.currency &&
    (existing.dest ?? null) === dest
  ) {
    return { payment: existing, changed: false };
  }

  const stripe = getStripe();
  let productId = existing?.productId;
  if (!productId) {
    const product = await stripe.products.create({
      name: `Website — ${opts.content.businessName}`.slice(0, 250),
      metadata: { kind: "site_sale", site_id: opts.siteId, tenant_id: opts.tenantId },
    });
    productId = product.id;
  }
  const price = await stripe.prices.create({
    product: productId,
    unit_amount: parsed.amount,
    currency: parsed.currency,
  });
  const link = await stripe.paymentLinks.create({
    line_items: [{ price: price.id, quantity: 1 }],
    metadata: { kind: "site_sale", site_id: opts.siteId, tenant_id: opts.tenantId },
    after_completion: {
      type: "redirect",
      redirect: { url: opts.liveUrl },
    },
    ...(dest
      ? {
          transfer_data: { destination: dest },
          application_fee_amount: Math.round(
            (parsed.amount * PLATFORM_COMMISSION_PCT) / 100,
          ),
        }
      : {}),
  });
  if (existing?.linkId && existing.linkId !== link.id) {
    await stripe.paymentLinks
      .update(existing.linkId, { active: false })
      .catch(() => {});
  }
  return {
    payment: {
      productId,
      priceId: price.id,
      linkId: link.id,
      link: link.url,
      priceStr: opts.priceStr.trim(),
      amount: parsed.amount,
      currency: parsed.currency,
      dest,
      paidAt: existing?.paidAt ?? null,
    },
    changed: true,
  };
}

export type SiteMaintenance = NonNullable<SiteContent["maintenance"]>;

/**
 * A recurring monthly payment link for an ongoing maintenance retainer,
 * pitched after the one-time sale. Same routing rules as the sale link
 * (platform-direct or Connect destination + commission), but subscription
 * mode. Verified empirically: the fee/destination fields belong at the TOP
 * level of the Payment Link, not nested under subscription_data — Stripe
 * rejects them there ("unknown parameters").
 */
export async function ensureMaintenanceLink(opts: {
  siteId: string;
  tenantId: string;
  content: SiteContent;
  priceStr: string;
  liveUrl: string;
  platformDirect: boolean;
  connectAccountId?: string | null;
}): Promise<
  { maintenance: SiteMaintenance; changed: boolean } | { error: string }
> {
  if (!isStripeConfigured())
    return { error: "Stripe is not configured (STRIPE_SECRET_KEY)." };
  const dest = opts.platformDirect ? null : (opts.connectAccountId ?? null);
  if (!opts.platformDirect && !dest)
    return {
      error:
        "Connect Stripe payouts in Settings to offer maintenance plans.",
    };
  const parsed = parsePrice(opts.priceStr);
  if (!parsed) return { error: "Enter a valid monthly price (e.g. 29 €)." };

  const existing = opts.content.maintenance;
  if (
    existing?.link &&
    existing.amount === parsed.amount &&
    existing.currency === parsed.currency &&
    (existing.dest ?? null) === dest
  ) {
    return { maintenance: existing, changed: false };
  }

  const stripe = getStripe();
  let productId = existing?.productId;
  if (!productId) {
    const product = await stripe.products.create({
      name: `Website maintenance — ${opts.content.businessName}`.slice(0, 250),
      metadata: {
        kind: "site_maintenance",
        site_id: opts.siteId,
        tenant_id: opts.tenantId,
      },
    });
    productId = product.id;
  }
  const price = await stripe.prices.create({
    product: productId,
    unit_amount: parsed.amount,
    currency: parsed.currency,
    recurring: { interval: "month" },
  });
  const meta = {
    kind: "site_maintenance",
    site_id: opts.siteId,
    tenant_id: opts.tenantId,
  };
  const link = await stripe.paymentLinks.create({
    line_items: [{ price: price.id, quantity: 1 }],
    metadata: meta,
    subscription_data: { metadata: meta },
    after_completion: { type: "redirect", redirect: { url: opts.liveUrl } },
    ...(dest
      ? {
          transfer_data: { destination: dest },
          application_fee_percent: PLATFORM_COMMISSION_PCT,
        }
      : {}),
  });
  if (existing?.linkId && existing.linkId !== link.id) {
    await stripe.paymentLinks
      .update(existing.linkId, { active: false })
      .catch(() => {});
  }
  return {
    maintenance: {
      productId,
      priceId: price.id,
      linkId: link.id,
      link: link.url,
      priceStr: opts.priceStr.trim(),
      amount: parsed.amount,
      currency: parsed.currency,
      dest,
      status: existing?.status === "active" ? "active" : "none",
      subscriptionId: existing?.subscriptionId ?? null,
      startedAt: existing?.startedAt ?? null,
      canceledAt: existing?.canceledAt ?? null,
    },
    changed: true,
  };
}

export type SiteChatbotPayment = NonNullable<SiteContent["chatbotPayment"]>;

/**
 * One-time payment link for the AI-chatbot add-on — a separate purchase from
 * the site itself, same routing rules as the sale link. Deliberately its own
 * Product (not bundled into the site's), so it can be pitched and sold
 * independently, before or after the site sells.
 */
export async function ensureChatbotPaymentLink(opts: {
  siteId: string;
  tenantId: string;
  content: SiteContent;
  priceStr: string;
  liveUrl: string;
  platformDirect: boolean;
  connectAccountId?: string | null;
}): Promise<
  { payment: SiteChatbotPayment; changed: boolean } | { error: string }
> {
  if (!isStripeConfigured())
    return { error: "Stripe is not configured (STRIPE_SECRET_KEY)." };
  const dest = opts.platformDirect ? null : (opts.connectAccountId ?? null);
  if (!opts.platformDirect && !dest)
    return {
      error: "Connect Stripe payouts in Settings to sell the AI chatbot add-on.",
    };
  const parsed = parsePrice(opts.priceStr);
  if (!parsed) return { error: "Enter a valid price (e.g. 199 €)." };

  const existing = opts.content.chatbotPayment;
  if (
    existing?.link &&
    existing.amount === parsed.amount &&
    existing.currency === parsed.currency &&
    (existing.dest ?? null) === dest
  ) {
    return { payment: existing, changed: false };
  }

  const stripe = getStripe();
  let productId = existing?.productId;
  if (!productId) {
    const product = await stripe.products.create({
      name: `AI Chatbot — ${opts.content.businessName}`.slice(0, 250),
      metadata: {
        kind: "chatbot_addon",
        site_id: opts.siteId,
        tenant_id: opts.tenantId,
      },
    });
    productId = product.id;
  }
  const price = await stripe.prices.create({
    product: productId,
    unit_amount: parsed.amount,
    currency: parsed.currency,
  });
  const link = await stripe.paymentLinks.create({
    line_items: [{ price: price.id, quantity: 1 }],
    metadata: {
      kind: "chatbot_addon",
      site_id: opts.siteId,
      tenant_id: opts.tenantId,
    },
    after_completion: { type: "redirect", redirect: { url: opts.liveUrl } },
    ...(dest
      ? {
          transfer_data: { destination: dest },
          application_fee_amount: Math.round(
            (parsed.amount * PLATFORM_COMMISSION_PCT) / 100,
          ),
        }
      : {}),
  });
  if (existing?.linkId && existing.linkId !== link.id) {
    await stripe.paymentLinks
      .update(existing.linkId, { active: false })
      .catch(() => {});
  }
  return {
    payment: {
      productId,
      priceId: price.id,
      linkId: link.id,
      link: link.url,
      priceStr: opts.priceStr.trim(),
      amount: parsed.amount,
      currency: parsed.currency,
      dest,
      paidAt: existing?.paidAt ?? null,
    },
    changed: true,
  };
}
