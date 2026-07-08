import "server-only";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import type { SiteContent } from "@/lib/templates/types";

// Auto-created Stripe Payment Links for selling a generated website through the
// pitch email. One Product per site (reused), a new Price + Payment Link when
// the asking price changes; superseded links are deactivated so an old email
// can't undercut a new offer.

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
}): Promise<
  { payment: SitePayment; changed: boolean } | { error: string }
> {
  if (!isStripeConfigured())
    return { error: "Stripe is not configured (STRIPE_SECRET_KEY)." };
  const parsed = parsePrice(opts.priceStr);
  if (!parsed) return { error: "Enter a valid price (e.g. 500 €)." };

  const existing = opts.content.payment;
  if (
    existing?.link &&
    existing.amount === parsed.amount &&
    existing.currency === parsed.currency
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
      paidAt: existing?.paidAt ?? null,
    },
    changed: true,
  };
}
