// Branded HTML pitch email. Isomorphic on purpose (no "server-only") so the
// editor can render a live preview of exactly what the business will receive.
// Table-based layout with inline styles — the only thing email clients respect.

export type PitchOffer = {
  /** Display price, e.g. "299 €" or "$490". Free text. */
  price?: string;
  /** Checkout URL (e.g. a Stripe Payment Link). Adds a Buy button. */
  paymentLink?: string;
};

type EmailStrings = {
  yourNewWebsite: string;
  viewSite: string;
  offerTitle: string;
  priceLabel: string;
  buyNow: string;
  orReply: string;
  footer: string; // {sender} placeholder
};

const EMAIL_STRINGS: Record<string, EmailStrings> = {
  en: {
    yourNewWebsite: "Your new website",
    viewSite: "View your website",
    offerTitle: "Want to keep it?",
    priceLabel: "One-time price",
    buyNow: "Buy this website",
    orReply: "Or just reply to this email — happy to answer any questions.",
    footer: "Sent by {sender} · Reply directly to this email",
  },
  fi: {
    yourNewWebsite: "Uusi verkkosivusi",
    viewSite: "Katso verkkosivusi",
    offerTitle: "Haluatko pitää sen?",
    priceLabel: "Kertahinta",
    buyNow: "Osta verkkosivu",
    orReply: "Tai vastaa tähän sähköpostiin — vastaan mielelläni kysymyksiin.",
    footer: "Lähettäjä {sender} · Voit vastata suoraan tähän viestiin",
  },
  sv: {
    yourNewWebsite: "Din nya webbplats",
    viewSite: "Se din webbplats",
    offerTitle: "Vill du behålla den?",
    priceLabel: "Engångspris",
    buyNow: "Köp webbplatsen",
    orReply: "Eller svara bara på det här mejlet — jag svarar gärna på frågor.",
    footer: "Skickat av {sender} · Svara direkt på detta mejl",
  },
  de: {
    yourNewWebsite: "Ihre neue Website",
    viewSite: "Website ansehen",
    offerTitle: "Möchten Sie sie behalten?",
    priceLabel: "Einmaliger Preis",
    buyNow: "Website kaufen",
    orReply:
      "Oder antworten Sie einfach auf diese E-Mail — ich beantworte gerne Ihre Fragen.",
    footer: "Gesendet von {sender} · Antworten Sie direkt auf diese E-Mail",
  },
  fr: {
    yourNewWebsite: "Votre nouveau site web",
    viewSite: "Voir votre site",
    offerTitle: "Envie de le garder ?",
    priceLabel: "Prix unique",
    buyNow: "Acheter le site",
    orReply:
      "Ou répondez simplement à cet e-mail — je serai ravi de répondre à vos questions.",
    footer: "Envoyé par {sender} · Répondez directement à cet e-mail",
  },
  es: {
    yourNewWebsite: "Su nueva página web",
    viewSite: "Ver su página web",
    offerTitle: "¿Quiere quedársela?",
    priceLabel: "Precio único",
    buyNow: "Comprar la página web",
    orReply:
      "O simplemente responda a este correo — con gusto resolveré sus dudas.",
    footer: "Enviado por {sender} · Responda directamente a este correo",
  },
  it: {
    yourNewWebsite: "Il vostro nuovo sito web",
    viewSite: "Guarda il sito",
    offerTitle: "Volete tenerlo?",
    priceLabel: "Prezzo una tantum",
    buyNow: "Acquista il sito",
    orReply:
      "Oppure rispondete a questa email — sarò felice di rispondere alle vostre domande.",
    footer: "Inviato da {sender} · Rispondete direttamente a questa email",
  },
  pt: {
    yourNewWebsite: "O seu novo site",
    viewSite: "Ver o seu site",
    offerTitle: "Quer ficar com ele?",
    priceLabel: "Preço único",
    buyNow: "Comprar o site",
    orReply:
      "Ou simplesmente responda a este e-mail — terei todo o gosto em esclarecer dúvidas.",
    footer: "Enviado por {sender} · Responda diretamente a este e-mail",
  },
  nl: {
    yourNewWebsite: "Uw nieuwe website",
    viewSite: "Bekijk uw website",
    offerTitle: "Wilt u hem houden?",
    priceLabel: "Eenmalige prijs",
    buyNow: "Website kopen",
    orReply:
      "Of beantwoord gewoon deze e-mail — ik beantwoord graag uw vragen.",
    footer: "Verzonden door {sender} · Reageer direct op deze e-mail",
  },
  zh: {
    yourNewWebsite: "您的新网站",
    viewSite: "查看您的网站",
    offerTitle: "想要保留它吗？",
    priceLabel: "一次性价格",
    buyNow: "购买此网站",
    orReply: "或直接回复此邮件——我很乐意解答您的疑问。",
    footer: "由 {sender} 发送 · 可直接回复此邮件",
  },
};

function strings(language: string | undefined | null): EmailStrings {
  return EMAIL_STRINGS[(language ?? "en").toLowerCase()] ?? EMAIL_STRINGS.en;
}

function esc(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const URL_RE = /https?:\/\/[^\s<>"')\]]+/g;

/** Escapes a paragraph and turns bare URLs into links. */
function paragraphHtml(text: string): string {
  const parts: string[] = [];
  let last = 0;
  for (const m of text.matchAll(URL_RE)) {
    parts.push(esc(text.slice(last, m.index)));
    parts.push(
      `<a href="${esc(m[0])}" style="color:#4f46e5;text-decoration:underline;">${esc(m[0])}</a>`,
    );
    last = m.index + m[0].length;
  }
  parts.push(esc(text.slice(last)));
  return parts.join("").replaceAll("\n", "<br />");
}

function button(href: string, label: string, bg: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;"><tr><td bgcolor="${bg}" style="border-radius:10px;">
    <a href="${esc(href)}" target="_blank" style="display:inline-block;padding:13px 30px;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">${esc(label)}</a>
  </td></tr></table>`;
}

export function renderPitchEmailHtml(opts: {
  body: string;
  businessName: string;
  tagline?: string | null;
  language?: string | null;
  liveUrl: string;
  senderName: string;
  heroImage?: string | null;
  offer?: PitchOffer;
}): string {
  const s = strings(opts.language);
  const font =
    "-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

  // The plain body carries the raw link; in HTML the hero and button do, so a
  // paragraph that is nothing but the URL gets dropped instead of shown bare.
  const paragraphs = opts.body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p && p !== opts.liveUrl.trim())
    .map(
      (p) =>
        `<p style="margin:0 0 14px;font-family:${font};font-size:15px;line-height:1.65;color:#3f3f46;">${paragraphHtml(p)}</p>`,
    )
    .join("");

  const hero = opts.heroImage
    ? `<tr><td><a href="${esc(opts.liveUrl)}" target="_blank"><img src="${esc(opts.heroImage)}" width="600" alt="${esc(opts.businessName)}" style="display:block;width:100%;height:auto;border:0;" /></a></td></tr>`
    : `<tr><td bgcolor="#4f46e5" align="center" style="padding:44px 32px;background:linear-gradient(135deg,#4f46e5,#7c3aed);">
        <a href="${esc(opts.liveUrl)}" target="_blank" style="text-decoration:none;">
          <span style="font-family:${font};font-size:26px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">${esc(opts.businessName)}</span>
        </a>
      </td></tr>`;

  const offer = opts.offer ?? {};
  const hasOffer = Boolean(offer.price?.trim() || offer.paymentLink?.trim());
  const offerBlock = hasOffer
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:26px 0 6px;"><tr><td align="center" bgcolor="#f5f3ff" style="border:1px solid #e4e0fb;border-radius:14px;padding:26px 24px;">
        <p style="margin:0 0 6px;font-family:${font};font-size:13px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#6d28d9;">${esc(s.offerTitle)}</p>
        ${
          offer.price?.trim()
            ? `<p style="margin:0 0 2px;font-family:${font};font-size:30px;font-weight:700;color:#18181b;">${esc(offer.price.trim())}</p>
               <p style="margin:0 0 16px;font-family:${font};font-size:12px;color:#71717a;">${esc(s.priceLabel)}</p>`
            : ""
        }
        ${
          offer.paymentLink?.trim()
            ? button(offer.paymentLink.trim(), s.buyNow, "#059669")
            : ""
        }
        <p style="margin:${offer.paymentLink?.trim() ? "14px" : "0"} 0 0;font-family:${font};font-size:13px;line-height:1.5;color:#52525b;">${esc(s.orReply)}</p>
      </td></tr></table>`
    : "";

  return `<!DOCTYPE html>
<html lang="${esc(opts.language ?? "en")}">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#f4f4f5">
    <tr><td align="center" style="padding:28px 12px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e4e4e7;">
        ${hero}
        <tr><td style="padding:32px 34px 30px;">
          <p style="margin:0 0 4px;font-family:${font};font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#4f46e5;">${esc(s.yourNewWebsite)}</p>
          <p style="margin:0 0 ${opts.tagline ? "2px" : "18px"};font-family:${font};font-size:22px;font-weight:700;letter-spacing:-0.01em;color:#18181b;">${esc(opts.businessName)}</p>
          ${opts.tagline ? `<p style="margin:0 0 18px;font-family:${font};font-size:14px;color:#71717a;">${esc(opts.tagline)}</p>` : ""}
          ${paragraphs}
          <div style="padding:10px 0 4px;">${button(opts.liveUrl, s.viewSite, "#4f46e5")}</div>
          ${offerBlock}
        </td></tr>
        <tr><td style="padding:18px 34px 20px;border-top:1px solid #f0f0f2;" align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 8px;"><tr>
            <td style="vertical-align:middle;"><img src="https://sitovai.com/brand-mark.png" width="18" height="18" alt="Sitovai" style="display:block;width:18px;height:18px;border:0;border-radius:5px;" /></td>
            <td style="padding-left:7px;font-family:${font};font-size:14px;font-weight:700;color:#3f3f46;vertical-align:middle;">Sitovai</td>
          </tr></table>
          <p style="margin:0;font-family:${font};font-size:12px;color:#a1a1aa;">${esc(s.footer.replace("{sender}", opts.senderName))}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/** Appends the offer to the plain-text alternative so text-only clients see the buy path too. */
export function pitchTextWithOffer(
  body: string,
  language: string | undefined | null,
  offer?: PitchOffer,
): string {
  const price = offer?.price?.trim();
  const link = offer?.paymentLink?.trim();
  if (!price && !link) return body;
  const s = strings(language);
  const lines = [body.trimEnd(), "", "---", s.offerTitle];
  if (price) lines.push(`${s.priceLabel}: ${price}`);
  if (link) lines.push(`${s.buyNow}: ${link}`);
  lines.push(s.orReply);
  return lines.join("\n");
}
