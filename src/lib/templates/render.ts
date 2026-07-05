import type { SiteContent } from "./types";
import { pickTheme, type Theme } from "./themes";
import { inferSiteKind } from "./site-kind";

// Pure renderer (safe to import on client or server). Produces a complete, standalone,
// mobile-responsive HTML document. The visual identity comes from the resolved Theme
// (palette, fonts, hero layout, card style), so different businesses get different sites.

function esc(value: string | null | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
  return (letters || name.slice(0, 2)).toUpperCase();
}

/** heroText being light means the hero background is dark → use the lighter accent on it. */
function isLight(hex: string): boolean {
  const h = hex.replace("#", "");
  if (h.length < 6) return false;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
}

function starRow(rating: number): string {
  const r = Math.max(0, Math.min(5, Math.round(rating)));
  let out = "";
  for (let i = 1; i <= 5; i++) {
    out += `<span class="star${i <= r ? " on" : ""}">★</span>`;
  }
  return `<span class="stars" aria-label="${r}/5">${out}</span>`;
}

function cardCss(t: Theme): string {
  if (t.cardStyle === "shadow")
    return "background:#fff; border:1px solid rgba(0,0,0,.03); box-shadow:0 10px 34px rgba(0,0,0,.08);";
  if (t.cardStyle === "filled")
    return "background:var(--surface); border:1px solid transparent;";
  return "background:#fff; border:1px solid var(--border);";
}

function heroMarkup(content: SiteContent, t: Theme): string {
  const cta = esc(content.ctaText || "Ota yhteyttä");
  const tagline = content.tagline
    ? `<p class="tagline">${esc(content.tagline)}</p>`
    : "";
  const heading = esc(content.heroHeading || content.businessName);
  const sub = content.heroSubtext
    ? `<p class="lede">${esc(content.heroSubtext)}</p>`
    : "";
  const button = `<p class="hero-cta"><a class="btn" href="#contact">${cta}</a></p>`;
  const inner = `${tagline}<h1>${heading}</h1>${sub}${button}`;

  if (t.heroStyle === "split") {
    const art = content.heroImage
      ? `<img class="hero-img" src="${esc(content.heroImage)}" alt="" />`
      : `<div class="monogram">${esc(initials(content.businessName))}</div>`;
    return `<div class="hero hero-split"><div class="wrap split">
      <div class="split-text">${inner}</div>
      <div class="split-art">${art}</div>
    </div></div>`;
  }
  const cls = t.heroStyle === "center" ? "hero hero-center" : "hero hero-left";
  return `<div class="${cls}"><div class="wrap">${inner}</div></div>`;
}

export function renderSiteToHtml(content: SiteContent, templateId: string): string {
  const t = pickTheme(content, templateId);
  const c = content.contact;
  const heroAccent = isLight(t.heroText) ? t.accent2 : t.accent;
  const kind =
    content.kind ??
    inferSiteKind(content.source?.category, templateId, content.businessName);

  const services = (content.services ?? [])
    .map(
      (s) => `
      <article class="card">
        <h3>${esc(s.title)}</h3>
        <p>${esc(s.description)}</p>
      </article>`,
    )
    .join("");

  const highlights = (content.highlights ?? [])
    .map((h) => `<li>${esc(h)}</li>`)
    .join("");

  const reviews = (content.reviews ?? [])
    .filter((r) => r && r.text)
    .slice(0, 6)
    .map((r) => {
      const text =
        r.text.length > 280 ? `${r.text.slice(0, 277).trimEnd()}…` : r.text;
      const meta = [esc(r.author), r.relativeTime ? esc(r.relativeTime) : ""]
        .filter(Boolean)
        .join(" · ");
      return `<article class="card review">
        ${starRow(r.rating)}
        <p class="rtext">${esc(text)}</p>
        <p class="rauthor">${meta}</p>
      </article>`;
    })
    .join("");

  const hours = (c.hours ?? []).map((h) => `<li>${esc(h)}</li>`).join("");

  const mapEmbed = c.mapsQuery
    ? `<iframe title="Map" loading="lazy" src="https://www.google.com/maps?q=${encodeURIComponent(
        c.mapsQuery,
      )}&output=embed"></iframe>`
    : "";

  const phoneRow = c.phone
    ? `<p><strong>Puhelin:</strong> <a href="tel:${esc(c.phone)}">${esc(c.phone)}</a></p>`
    : "";
  const emailRow = c.email
    ? `<p><strong>Sähköposti:</strong> <a href="mailto:${esc(c.email)}">${esc(c.email)}</a></p>`
    : "";
  const addressRow = c.address ? `<p><strong>Osoite:</strong> ${esc(c.address)}</p>` : "";

  // ---- Membership (gyms/studios) ----
  const plans = content.membershipPlans ?? [];
  const membershipSection =
    kind === "membership" && plans.length
      ? `<section id="pricing"><div class="wrap">
    <h2>Jäsenyydet</h2>
    <div class="plans">
      ${plans
        .map(
          (p) => `<article class="plan${p.highlight ? " plan-featured" : ""}">
        ${p.highlight ? `<span class="plan-badge">Suosituin</span>` : ""}
        <h3>${esc(p.name)}</h3>
        <div class="plan-price"><span class="amount">${esc(p.price)}</span> <span class="per">${esc(p.period)}</span></div>
        <ul>${p.features.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>
        <a class="btn plan-cta" href="#contact">Liity nyt</a>
      </article>`,
        )
        .join("")}
    </div>
  </div></section>`
      : "";

  // ---- Booking (barbers/salons/appointment businesses) ----
  const serviceOptions = (content.services ?? [])
    .map((s) => `<option>${esc(s.title)}</option>`)
    .join("");
  const bookingSection =
    kind === "booking"
      ? `<section id="booking" class="booking"><div class="wrap">
    <h2>Varaa aika</h2>
    <p class="lede-muted">Jätä ajanvarauspyyntö, niin vahvistamme ajan pian.${
      c.phone ? ` Voit myös soittaa: <a href="tel:${esc(c.phone)}">${esc(c.phone)}</a>.` : ""
    }</p>
    <form class="form"${
      c.email
        ? ` action="mailto:${esc(c.email)}" method="post" enctype="text/plain"`
        : ""
    }>
      <div class="fields">
        ${serviceOptions ? `<label>Palvelu<select name="Palvelu">${serviceOptions}</select></label>` : ""}
        <label>Nimi<input name="Nimi" required /></label>
        <label>Puhelin<input name="Puhelin" required /></label>
        <label>Toivottu aika<input name="Toivottu-aika" placeholder="esim. ma 14:00" /></label>
      </div>
      <button class="btn" type="submit">Lähetä varauspyyntö</button>
    </form>
  </div></section>`
      : "";

  // ---- Contact form (mailto, when we have an email) ----
  const contactForm = c.email
    ? `<h3 class="form-title">Lähetä meille viesti</h3>
      <form class="form contact-form" action="mailto:${esc(c.email)}" method="post" enctype="text/plain">
        <label>Nimi<input name="Nimi" required /></label>
        <label>Sähköposti<input type="email" name="Sahkoposti" required /></label>
        <label>Viesti<textarea name="Viesti" rows="4" required></textarea></label>
        <button class="btn" type="submit">Lähetä viesti</button>
      </form>`
    : "";

  // ---- Images ----
  const galleryImgs = (content.gallery ?? []).filter(Boolean);
  const gallerySection = galleryImgs.length
    ? `<section id="gallery"><div class="wrap">
    <h2>Galleria</h2>
    <div class="gallery">${galleryImgs
      .map((u) => `<img src="${esc(u)}" alt="" loading="lazy" />`)
      .join("")}</div>
  </div></section>`
    : "";
  const heroBanner =
    content.heroImage && t.heroStyle !== "split"
      ? `<div class="hero-banner"><div class="wrap"><img src="${esc(content.heroImage)}" alt="" /></div></div>`
      : "";

  // ---- Header nav (only sections that exist) ----
  const navLinks = [
    services ? ["#services", "Palvelut"] : null,
    galleryImgs.length ? ["#gallery", "Galleria"] : null,
    membershipSection ? ["#pricing", "Hinnasto"] : null,
    bookingSection ? ["#booking", "Varaa aika"] : null,
    reviews ? ["#reviews", "Arvostelut"] : null,
    ["#contact", "Yhteystiedot"],
  ].filter(Boolean) as [string, string][];
  const nav = navLinks
    .map(([href, label]) => `<a href="${href}">${esc(label)}</a>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="fi">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(content.businessName)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="${t.googleFonts}" rel="stylesheet" />
<style>
  :root {
    --accent: ${t.accent}; --accent2: ${t.accent2}; --ink: ${t.ink};
    --muted: ${t.muted}; --bg: ${t.bg}; --surface: ${t.surface};
    --border: ${t.border}; --radius: ${t.radius}px; --on-accent: ${t.onAccent};
    --hero-bg: ${t.heroBg}; --hero-text: ${t.heroText}; --hero-muted: ${t.heroMuted};
    --hero-accent: ${heroAccent};
  }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: ${t.bodyFont}; color: var(--ink); background: var(--bg); line-height: 1.65; }
  h1, h2, h3 { font-family: ${t.headingFont}; }
  a { color: var(--accent); }
  .wrap { max-width: 1080px; margin: 0 auto; padding: 0 24px; }
  header.site { position: sticky; top: 0; background: color-mix(in srgb, var(--bg) 88%, transparent); backdrop-filter: blur(8px); border-bottom: 1px solid var(--border); z-index: 10; }
  header.site .wrap { display: flex; align-items: center; justify-content: space-between; height: 66px; }
  .brand { font-family: ${t.headingFont}; font-weight: 700; font-size: 21px; }
  .header-actions { display: flex; align-items: center; gap: 24px; }
  .nav { display: none; gap: 24px; align-items: center; }
  .nav a { color: var(--ink); text-decoration: none; font-size: 15px; font-weight: 500; opacity: .82; }
  .nav a:hover { opacity: 1; color: var(--accent); }
  @media (min-width: 860px) { .nav { display: flex; } }
  .btn { display: inline-block; background: var(--accent); color: var(--on-accent); padding: 13px 22px; border-radius: var(--radius); text-decoration: none; font-weight: 600; transition: filter .15s ease; }
  .btn:hover { filter: brightness(1.08); }

  .hero { background: var(--hero-bg); color: var(--hero-text); padding: 104px 0; }
  .hero h1 { font-size: clamp(34px, 5.4vw, 58px); line-height: 1.06; margin: 0 0 18px; letter-spacing: -0.01em; }
  .hero .lede { font-size: 19px; max-width: 600px; color: var(--hero-muted); margin: 0; }
  .hero-cta { margin-top: 30px; }
  .tagline { text-transform: uppercase; letter-spacing: .16em; font-size: 12.5px; font-weight: 700; color: var(--hero-accent); margin: 0 0 14px; }
  .hero-center .wrap { text-align: center; }
  .hero-center .lede { margin-left: auto; margin-right: auto; }
  .hero-split .split { display: grid; grid-template-columns: 1.1fr .9fr; gap: 48px; align-items: center; }
  .split-art { display: flex; justify-content: center; }
  .monogram { width: 230px; height: 230px; display: grid; place-items: center; border-radius: calc(var(--radius) + 10px); background: linear-gradient(135deg, var(--accent), var(--accent2)); color: var(--on-accent); font-family: ${t.headingFont}; font-weight: 700; font-size: 92px; box-shadow: 0 24px 60px rgba(0,0,0,.28); }
  .hero-img { width: 100%; max-width: 380px; height: 320px; object-fit: cover; border-radius: calc(var(--radius) + 10px); box-shadow: 0 24px 60px rgba(0,0,0,.28); }
  .hero-banner { padding-top: 44px; }
  .hero-banner img { width: 100%; max-height: 440px; object-fit: cover; border-radius: var(--radius); display: block; }
  .gallery { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
  .gallery img { width: 100%; height: 230px; object-fit: cover; border-radius: var(--radius); display: block; }

  section { padding: 76px 0; }
  section h2 { font-size: clamp(26px, 3.4vw, 34px); margin: 0 0 28px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
  .card { border-radius: var(--radius); padding: 24px; ${cardCss(t)} }
  .card h3 { margin: 0 0 8px; color: var(--accent); font-size: 18px; }
  .card p { margin: 0; color: var(--muted); }
  .about { display: grid; grid-template-columns: 1.4fr 1fr; gap: 44px; align-items: start; }
  .about p { color: var(--muted); font-size: 17px; }
  ul.checks { list-style: none; padding: 0; margin: 0; }
  ul.checks li { padding: 9px 0 9px 30px; position: relative; color: var(--ink); }
  ul.checks li::before { content: "✓"; position: absolute; left: 0; color: var(--accent); font-weight: 700; }

  /* pricing / membership */
  .plans { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; }
  .plan { position: relative; border-radius: var(--radius); padding: 30px 24px; background: #fff; border: 1px solid var(--border); text-align: center; }
  .plan-featured { border-color: var(--accent); box-shadow: 0 18px 46px rgba(0,0,0,.12); }
  .plan-badge { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: var(--accent); color: var(--on-accent); font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 999px; white-space: nowrap; }
  .plan h3 { margin: 0 0 10px; font-size: 20px; }
  .plan-price { margin-bottom: 18px; }
  .plan-price .amount { font-size: 34px; font-weight: 800; color: var(--ink); }
  .plan-price .per { color: var(--muted); }
  .plan ul { list-style: none; padding: 0; margin: 0 0 24px; text-align: left; }
  .plan li { padding: 7px 0 7px 26px; position: relative; color: var(--muted); }
  .plan li::before { content: "✓"; position: absolute; left: 0; color: var(--accent); font-weight: 700; }
  .plan-cta { width: 100%; box-sizing: border-box; }

  /* forms (booking + contact) */
  .booking { background: var(--surface); }
  .lede-muted { color: var(--muted); margin: -12px 0 26px; max-width: 620px; }
  .form { max-width: 640px; }
  .form .fields { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; margin-bottom: 18px; }
  .form label { display: block; font-size: 13px; font-weight: 600; color: var(--ink); margin-bottom: 14px; }
  .form input, .form select, .form textarea { display: block; width: 100%; margin-top: 6px; padding: 11px 12px; border: 1px solid var(--border); border-radius: var(--radius); font: inherit; background: #fff; color: var(--ink); }
  .form button { border: 0; cursor: pointer; }
  .contact-form { margin-top: 8px; }
  .form-title { font-size: 19px; margin: 28px 0 12px; }

  .reviews { background: var(--surface); }
  .stars { display: inline-flex; gap: 2px; font-size: 16px; letter-spacing: 1px; }
  .star { color: var(--border); }
  .star.on { color: var(--accent); }
  .review .rtext { margin: 12px 0 14px; color: var(--ink); font-size: 15.5px; }
  .review .rauthor { margin: 0; color: var(--muted); font-size: 13.5px; font-weight: 600; }
  .attrib { margin: 24px 0 0; font-size: 12.5px; color: var(--muted); }

  .contact { background: var(--surface); }
  .contact .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 34px; }
  .contact p { color: var(--ink); }
  iframe { width: 100%; height: 330px; border: 0; border-radius: var(--radius); }
  ul.hours { list-style: none; padding: 0; margin: 8px 0 0; color: var(--muted); }
  footer.site { padding: 34px 0; border-top: 1px solid var(--border); color: var(--muted); font-size: 14px; text-align: center; }
  @media (max-width: 780px) {
    .about, .contact .cols, .hero-split .split { grid-template-columns: 1fr; }
    .hero { padding: 64px 0; }
    .split-art { order: -1; } .monogram { width: 150px; height: 150px; font-size: 60px; }
  }
</style>
</head>
<body>
  <header class="site"><div class="wrap">
    <span class="brand">${esc(content.businessName)}</span>
    <div class="header-actions">
      <nav class="nav">${nav}</nav>
      <a class="btn" href="#contact">${esc(content.ctaText || "Ota yhteyttä")}</a>
    </div>
  </div></header>

  ${heroMarkup(content, t)}
  ${heroBanner}

  ${
    content.about || highlights
      ? `<section><div class="wrap about">
    <div><h2>Tietoa meistä</h2><p>${esc(content.about)}</p></div>
    ${highlights ? `<ul class="checks">${highlights}</ul>` : ""}
  </div></section>`
      : ""
  }

  ${
    services
      ? `<section id="services" style="background:var(--surface)"><div class="wrap">
    <h2>Palvelut</h2>
    <div class="grid">${services}</div>
  </div></section>`
      : ""
  }

  ${gallerySection}

  ${membershipSection}

  ${bookingSection}

  ${
    reviews
      ? `<section id="reviews" class="reviews"><div class="wrap">
    <h2>Asiakkaidemme arvostelut</h2>
    <div class="grid">${reviews}</div>
    <p class="attrib">★ Arvostelut Googlesta</p>
  </div></section>`
      : ""
  }

  <section class="contact" id="contact"><div class="wrap">
    <h2>Yhteystiedot</h2>
    <div class="cols">
      <div>
        ${addressRow}
        ${phoneRow}
        ${emailRow}
        ${hours ? `<p style="margin-bottom:0"><strong>Aukioloajat:</strong></p><ul class="hours">${hours}</ul>` : ""}
        ${contactForm}
      </div>
      <div>${mapEmbed}</div>
    </div>
  </div></section>

  <footer class="site"><div class="wrap">
    © ${new Date().getFullYear()} ${esc(content.businessName)}
  </div></footer>
</body>
</html>`;
}
