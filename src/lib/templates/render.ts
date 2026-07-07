import type { SiteContent } from "./types";
import { pickTheme, type Theme } from "./themes";
import { t as strings } from "./i18n";

// Pure renderer (safe to import on client or server). Produces a complete, standalone,
// mobile-responsive HTML document. Visual identity comes from the resolved Theme;
// every fixed UI string comes from the i18n table (content.language; legacy = Finnish).

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

function isLight(hex: string): boolean {
  const h = hex.replace("#", "");
  if (h.length < 6) return false;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
}

function starRow(rating: number, cls = "stars"): string {
  const r = Math.max(0, Math.min(5, Math.round(rating)));
  let out = "";
  for (let i = 1; i <= 5; i++) {
    out += `<span class="star${i <= r ? " on" : ""}">★</span>`;
  }
  return `<span class="${cls}" aria-label="${r}/5">${out}</span>`;
}

function cardCss(t: Theme): string {
  const shadow = t.dark
    ? "0 14px 40px rgba(0,0,0,.45)"
    : "0 10px 34px rgba(0,0,0,.08)";
  if (t.cardStyle === "shadow")
    return `background:var(--card); border:var(--bw) solid ${
      t.dark ? "var(--border)" : "rgba(0,0,0,.03)"
    }; box-shadow:${shadow};`;
  if (t.cardStyle === "filled")
    return "background:var(--surface); border:var(--bw) solid transparent;";
  return "background:var(--card); border:var(--bw) solid var(--border);";
}

const WAVE =
  "M0,32 C240,64 480,0 720,24 C960,48 1200,8 1440,40 L1440,64 L0,64 Z";
const SLANT = "M0,64 L1440,8 L1440,64 Z";

function dividerSvg(t: Theme): string {
  if (t.divider === "none") return "";
  const path = t.divider === "wave" ? WAVE : SLANT;
  return `<div class="hero-divider" aria-hidden="true"><svg viewBox="0 0 1440 64" preserveAspectRatio="none"><path d="${path}" fill="${t.bg}"/></svg></div>`;
}

export function renderSiteToHtml(content: SiteContent, templateId: string): string {
  const t = pickTheme(content, templateId);
  const s = strings(content.language);
  const c = content.contact;
  const heroAccent = isLight(t.heroText) ? t.accent2 : t.accent;
  const kind = content.kind ?? "standard";

  /* ------------------------------- pieces ------------------------------- */

  const reviewsList = (content.reviews ?? []).filter((r) => r && r.text);
  const avgRating = reviewsList.length
    ? reviewsList.reduce((a, r) => a + (r.rating || 0), 0) / reviewsList.length
    : null;

  const trustChip =
    avgRating && reviewsList.length >= 2
      ? `<div class="trust">${starRow(avgRating, "stars hero-stars")}<span>${avgRating
          .toFixed(1)
          .replace(".", ",")} · Google</span></div>`
      : "";

  const primaryHref = kind === "booking" ? "#booking" : "#contact";
  const secondaryCta = c.phone
    ? `<a class="btn-ghost" href="tel:${esc(c.phone)}">${esc(s.call)} ${esc(c.phone)}</a>`
    : "";

  function heroMarkup(): string {
    const cta = esc(content.ctaText || s.navContact);
    const tagline = content.tagline
      ? `<p class="tagline">${esc(content.tagline)}</p>`
      : "";
    const heading = esc(content.heroHeading || content.businessName);
    const sub = content.heroSubtext
      ? `<p class="lede">${esc(content.heroSubtext)}</p>`
      : "";
    const ctas = `<div class="hero-cta"><a class="btn" href="${primaryHref}">${cta}</a>${secondaryCta}</div>`;
    const inner = `${tagline}<h1>${heading}</h1>${sub}${trustChip}${ctas}`;

    if (t.heroStyle === "split") {
      const art = content.heroImage
        ? `<img class="hero-img" src="${esc(content.heroImage)}" alt="" />`
        : `<div class="monogram">${esc(initials(content.businessName))}</div>`;
      return `<div class="hero hero-split"><div class="wrap split">
        <div class="split-text">${inner}</div>
        <div class="split-art">${art}</div>
      </div>${dividerSvg(t)}</div>`;
    }
    const cls = t.heroStyle === "center" ? "hero hero-center" : "hero hero-left";
    return `<div class="${cls}"><div class="wrap">${inner}</div>${dividerSvg(t)}</div>`;
  }

  const heroBanner =
    content.heroImage && t.heroStyle !== "split"
      ? `<div class="hero-banner"><div class="wrap"><img src="${esc(content.heroImage)}" alt="" /></div></div>`
      : "";

  const highlights = (content.highlights ?? [])
    .map((h) => `<li>${esc(h)}</li>`)
    .join("");

  const statsSection = (content.stats ?? []).length
    ? `<section class="statsband"><div class="wrap stats">${(content.stats ?? [])
        .slice(0, 4)
        .map(
          (st) =>
            `<div class="stat"><div class="v">${esc(st.value)}</div><div class="l">${esc(st.label)}</div></div>`,
        )
        .join("")}</div></section>`
    : "";

  const servicesItems = content.services ?? [];
  const servicesSection = servicesItems.length
    ? t.serviceStyle === "rows"
      ? `<section id="services"><div class="wrap">
    <h2>${esc(s.services)}</h2>
    <div class="rows">${servicesItems
      .map(
        (sv, i) => `<article class="row"><span class="idx">${String(i + 1).padStart(2, "0")}</span>
        <div><h3>${esc(sv.title)}</h3><p>${esc(sv.description)}</p></div></article>`,
      )
      .join("")}</div>
  </div></section>`
      : `<section id="services" class="alt"><div class="wrap">
    <h2>${esc(s.services)}</h2>
    <div class="grid">${servicesItems
      .map(
        (sv) => `<article class="card"><h3>${esc(sv.title)}</h3><p>${esc(sv.description)}</p></article>`,
      )
      .join("")}</div>
  </div></section>`
    : "";

  const galleryImgs = (content.gallery ?? []).filter(Boolean);
  const gallerySection = galleryImgs.length
    ? `<section id="gallery"><div class="wrap">
    <h2>${esc(s.gallery)}</h2>
    <div class="gallery">${galleryImgs
      .map((u) => `<img src="${esc(u)}" alt="" loading="lazy" />`)
      .join("")}</div>
  </div></section>`
    : "";

  const plans = content.membershipPlans ?? [];
  const membershipSection =
    kind === "membership" && plans.length
      ? `<section id="pricing" class="alt"><div class="wrap">
    <h2>${esc(s.memberships)}</h2>
    <div class="plans">${plans
      .map(
        (p) => `<article class="plan${p.highlight ? " plan-featured" : ""}">
        ${p.highlight ? `<span class="plan-badge">${esc(s.mostPopular)}</span>` : ""}
        <h3>${esc(p.name)}</h3>
        <div class="plan-price"><span class="amount">${esc(p.price)}</span> <span class="per">${esc(p.period)}</span></div>
        <ul>${p.features.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>
        <a class="btn plan-cta" href="#contact">${esc(s.joinNow)}</a>
      </article>`,
      )
      .join("")}</div>
  </div></section>`
      : "";

  const serviceOptions = servicesItems
    .map((sv) => `<option>${esc(sv.title)}</option>`)
    .join("");
  const bookingSection =
    kind === "booking"
      ? `<section id="booking" class="alt"><div class="wrap">
    <h2>${esc(s.booking)}</h2>
    <p class="lede-muted">${esc(s.bookingIntro)}${
      c.phone
        ? ` ${esc(s.bookingCall)} <a href="tel:${esc(c.phone)}">${esc(c.phone)}</a>`
        : ""
    }</p>
    <form class="form"${
      c.email
        ? ` action="mailto:${esc(c.email)}" method="post" enctype="text/plain"`
        : ""
    }>
      <div class="fields">
        ${serviceOptions ? `<label>${esc(s.service)}<select name="${esc(s.service)}">${serviceOptions}</select></label>` : ""}
        <label>${esc(s.name)}<input name="${esc(s.name)}" required /></label>
        <label>${esc(s.phone)}<input name="${esc(s.phone)}" required /></label>
        <label>${esc(s.preferredTime)}<input name="${esc(s.preferredTime)}" placeholder="${esc(s.preferredTimeHint)}" /></label>
      </div>
      <button class="btn" type="submit">${esc(s.sendBooking)}</button>
    </form>
  </div></section>`
      : "";

  const reviewsSection = reviewsList.length
    ? `<section id="reviews" class="alt"><div class="wrap">
    <h2>${esc(s.reviews)}</h2>
    <div class="grid">${reviewsList
      .slice(0, 6)
      .map((r) => {
        const text =
          r.text.length > 280 ? `${r.text.slice(0, 277).trimEnd()}…` : r.text;
        const meta = [esc(r.author), r.relativeTime ? esc(r.relativeTime) : ""]
          .filter(Boolean)
          .join(" · ");
        return `<article class="card review">${starRow(r.rating)}<p class="rtext">${esc(text)}</p><p class="rauthor">${meta}</p></article>`;
      })
      .join("")}</div>
    <p class="attrib">★ ${esc(s.reviewsFrom)}</p>
  </div></section>`
    : "";

  const faqItems = (content.faq ?? []).filter((f) => f && f.q && f.a);
  const faqSection = faqItems.length
    ? `<section id="faq"><div class="wrap narrow">
    <h2>${esc(s.faq)}</h2>
    <div class="faqs">${faqItems
      .slice(0, 6)
      .map(
        (f) =>
          `<details class="faqi"><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`,
      )
      .join("")}</div>
  </div></section>`
    : "";

  const ctaBand = `<section class="cta-wrap"><div class="wrap">
    <div class="cta-band">
      <h2>${esc(s.ctaHeading)}</h2>
      <p>${esc(s.ctaSub)}</p>
      <a class="btn btn-invert" href="${primaryHref}">${esc(content.ctaText || s.navContact)}</a>
    </div>
  </div></section>`;

  const contactForm = c.email
    ? `<h3 class="form-title">${esc(s.sendMessageTitle)}</h3>
      <form class="form contact-form" action="mailto:${esc(c.email)}" method="post" enctype="text/plain">
        <label>${esc(s.name)}<input name="${esc(s.name)}" required /></label>
        <label>${esc(s.email)}<input type="email" name="${esc(s.email)}" required /></label>
        <label>${esc(s.message)}<textarea name="${esc(s.message)}" rows="4" required></textarea></label>
        <button class="btn" type="submit">${esc(s.send)}</button>
      </form>`
    : "";

  const hours = (c.hours ?? []).map((h) => `<li>${esc(h)}</li>`).join("");
  const mapEmbed = c.mapsQuery
    ? `<iframe title="Map" loading="lazy" src="https://www.google.com/maps?q=${encodeURIComponent(
        c.mapsQuery,
      )}&output=embed"></iframe>`
    : "";
  const phoneRow = c.phone
    ? `<p><strong>${esc(s.phoneLabel)}:</strong> <a href="tel:${esc(c.phone)}">${esc(c.phone)}</a></p>`
    : "";
  const emailRow = c.email
    ? `<p><strong>${esc(s.emailLabel)}:</strong> <a href="mailto:${esc(c.email)}">${esc(c.email)}</a></p>`
    : "";
  const addressRow = c.address
    ? `<p><strong>${esc(s.addressLabel)}:</strong> ${esc(c.address)}</p>`
    : "";

  const aboutShort = (content.about ?? "").split(/(?<=\.)\s+/)[0] ?? "";
  const footer = `<footer class="site"><div class="wrap foot-grid">
    <div><div class="brand">${esc(content.businessName)}</div><p class="foot-about">${esc(aboutShort)}</p></div>
    ${hours ? `<div><h4>${esc(s.openingHours)}</h4><ul class="hours">${hours}</ul></div>` : ""}
    <div><h4>${esc(s.contact)}</h4>
      ${c.address ? `<p>${esc(c.address)}</p>` : ""}
      ${c.phone ? `<p><a href="tel:${esc(c.phone)}">${esc(c.phone)}</a></p>` : ""}
      ${c.email ? `<p><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></p>` : ""}
    </div>
  </div>
  <div class="wrap copyright">© ${new Date().getFullYear()} ${esc(content.businessName)}</div>
  </footer>`;

  const navLinks = [
    servicesItems.length ? [`#services`, s.navServices] : null,
    galleryImgs.length ? [`#gallery`, s.navGallery] : null,
    membershipSection ? [`#pricing`, s.navPricing] : null,
    bookingSection ? [`#booking`, s.navBooking] : null,
    reviewsList.length ? [`#reviews`, s.navReviews] : null,
    [`#contact`, s.navContact],
  ].filter(Boolean) as [string, string][];
  const nav = navLinks
    .map(([href, label]) => `<a href="${href}">${esc(label)}</a>`)
    .join("");

  /* -------------------------------- html -------------------------------- */

  return `<!DOCTYPE html>
<html lang="${esc(content.language ?? "fi")}">
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
    --card: ${t.card}; --border: ${t.border}; --input-bg: ${t.inputBg};
    --radius: ${t.radius}px; --bw: ${t.borderW}px; --on-accent: ${t.onAccent};
    --hero-bg: ${t.heroBg}; --hero-text: ${t.heroText}; --hero-muted: ${t.heroMuted};
    --hero-accent: ${heroAccent};
  }
  * { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body { margin: 0; font-family: ${t.bodyFont}; color: var(--ink); background: var(--bg); line-height: 1.65; }
  h1, h2, h3, h4 { font-family: ${t.headingFont}; }
  a { color: var(--accent); }
  .wrap { max-width: 1080px; margin: 0 auto; padding: 0 24px; }
  .wrap.narrow { max-width: 760px; }
  section { padding: 80px 0; scroll-margin-top: 76px; }
  section.alt { background: var(--surface); }
  section h2 { font-size: clamp(26px, 3.4vw, 36px); margin: 0 0 30px; letter-spacing: -0.01em; }

  header.site { position: sticky; top: 0; background: color-mix(in srgb, var(--bg) 90%, transparent); backdrop-filter: blur(8px); border-bottom: var(--bw) solid var(--border); z-index: 10; }
  header.site .wrap { display: flex; align-items: center; justify-content: space-between; height: 66px; }
  .brand { font-family: ${t.headingFont}; font-weight: 700; font-size: 21px; color: var(--ink); }
  .header-actions { display: flex; align-items: center; gap: 24px; }
  .nav { display: none; gap: 22px; align-items: center; }
  .nav a { color: var(--ink); text-decoration: none; font-size: 15px; font-weight: 500; opacity: .8; }
  .nav a:hover { opacity: 1; color: var(--accent); }
  @media (min-width: 880px) { .nav { display: flex; } }

  .btn { display: inline-block; background: var(--accent); color: var(--on-accent); padding: 13px 24px; border-radius: var(--radius); text-decoration: none; font-weight: 600; border: 0; cursor: pointer; font-size: 15.5px; transition: filter .15s ease, transform .15s ease; }
  .btn:hover { filter: brightness(1.08); transform: translateY(-1px); }
  .btn-ghost { display: inline-block; padding: 12px 22px; border-radius: var(--radius); text-decoration: none; font-weight: 600; font-size: 15.5px; color: var(--hero-text); border: 1.5px solid color-mix(in srgb, var(--hero-text) 35%, transparent); }
  .btn-ghost:hover { border-color: var(--hero-text); }
  .btn-invert { background: var(--on-accent); color: var(--accent); }

  .hero { position: relative; background: var(--hero-bg); color: var(--hero-text); padding: 104px 0; overflow: hidden; }
  .hero.has-divider { padding-bottom: 150px; }
  .hero h1 { font-size: clamp(34px, 5.4vw, 60px); line-height: 1.06; margin: 0 0 18px; letter-spacing: -0.015em; }
  .hero .lede { font-size: 19px; max-width: 620px; color: var(--hero-muted); margin: 0 0 4px; }
  .tagline { text-transform: uppercase; letter-spacing: .16em; font-size: 12.5px; font-weight: 700; color: var(--hero-accent); margin: 0 0 14px; }
  .trust { display: inline-flex; align-items: center; gap: 9px; margin-top: 18px; padding: 7px 14px; border-radius: 999px; background: color-mix(in srgb, var(--hero-accent) 13%, transparent); font-size: 13.5px; font-weight: 600; }
  .hero-stars .star { color: color-mix(in srgb, var(--hero-text) 25%, transparent); font-size: 14px; }
  .hero-stars .star.on { color: var(--hero-accent); }
  .hero-cta { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 26px; }
  .hero-center .wrap { text-align: center; }
  .hero-center .lede { margin-left: auto; margin-right: auto; }
  .hero-center .hero-cta { justify-content: center; }
  .hero-split .split { display: grid; grid-template-columns: 1.1fr .9fr; gap: 48px; align-items: center; }
  .split-art { display: flex; justify-content: center; }
  .monogram { width: 230px; height: 230px; display: grid; place-items: center; border-radius: calc(var(--radius) + 10px); background: linear-gradient(135deg, var(--accent), var(--accent2)); color: var(--on-accent); font-family: ${t.headingFont}; font-weight: 700; font-size: 92px; box-shadow: 0 24px 60px rgba(0,0,0,.28); }
  .hero-img { width: 100%; max-width: 400px; height: 330px; object-fit: cover; border-radius: calc(var(--radius) + 10px); box-shadow: 0 24px 60px rgba(0,0,0,.3); }
  .hero-divider { position: absolute; left: 0; right: 0; bottom: -1px; line-height: 0; }
  .hero-divider svg { width: 100%; height: 64px; display: block; }
  .hero-banner { padding-top: 44px; background: var(--bg); }
  .hero-banner img { width: 100%; max-height: 460px; object-fit: cover; border-radius: var(--radius); display: block; }

  @keyframes rise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
  .hero .tagline, .hero h1, .hero .lede, .hero .trust, .hero .hero-cta, .hero .split-art { animation: rise .7s cubic-bezier(.16,1,.3,1) both; }
  .hero h1 { animation-delay: .05s } .hero .lede { animation-delay: .12s }
  .hero .trust { animation-delay: .18s } .hero .hero-cta { animation-delay: .24s }
  .hero .split-art { animation-delay: .2s }
  @media (prefers-reduced-motion: reduce) { .hero * { animation: none !important; } html { scroll-behavior: auto; } }

  .statsband { padding: 44px 0; border-bottom: var(--bw) solid var(--border); }
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 26px; text-align: center; }
  .stat .v { font-family: ${t.headingFont}; font-size: 32px; font-weight: 800; color: var(--accent); }
  .stat .l { color: var(--muted); font-size: 14px; margin-top: 2px; }

  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
  .card { border-radius: var(--radius); padding: 26px; ${cardCss(t)} }
  .card h3 { margin: 0 0 8px; color: var(--accent); font-size: 18.5px; }
  .card p { margin: 0; color: var(--muted); }
  .rows { border-bottom: var(--bw) solid var(--border); }
  .row { display: flex; gap: 30px; padding: 28px 0; border-top: var(--bw) solid var(--border); }
  .row .idx { font-family: ${t.headingFont}; font-weight: 700; color: var(--accent); font-size: 15px; padding-top: 7px; min-width: 34px; }
  .row h3 { margin: 0 0 6px; font-size: 20px; }
  .row p { margin: 0; color: var(--muted); max-width: 640px; }

  .about { display: grid; grid-template-columns: 1.4fr 1fr; gap: 44px; align-items: start; }
  .about p { color: var(--muted); font-size: 17px; }
  ul.checks { list-style: none; padding: 0; margin: 0; }
  ul.checks li { padding: 9px 0 9px 30px; position: relative; color: var(--ink); }
  ul.checks li::before { content: "✓"; position: absolute; left: 0; color: var(--accent); font-weight: 700; }

  .gallery { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
  .gallery img { width: 100%; height: 230px; object-fit: cover; border-radius: var(--radius); display: block; }

  .plans { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; }
  .plan { position: relative; border-radius: var(--radius); padding: 30px 24px; background: var(--card); border: var(--bw) solid var(--border); text-align: center; }
  .plan-featured { border-color: var(--accent); box-shadow: 0 18px 46px rgba(0,0,0,${t.dark ? ".5" : ".12"}); }
  .plan-badge { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: var(--accent); color: var(--on-accent); font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 999px; white-space: nowrap; }
  .plan h3 { margin: 0 0 10px; font-size: 20px; }
  .plan-price { margin-bottom: 18px; }
  .plan-price .amount { font-size: 34px; font-weight: 800; color: var(--ink); font-family: ${t.headingFont}; }
  .plan-price .per { color: var(--muted); }
  .plan ul { list-style: none; padding: 0; margin: 0 0 24px; text-align: left; }
  .plan li { padding: 7px 0 7px 26px; position: relative; color: var(--muted); }
  .plan li::before { content: "✓"; position: absolute; left: 0; color: var(--accent); font-weight: 700; }
  .plan-cta { width: 100%; }

  .lede-muted { color: var(--muted); margin: -12px 0 26px; max-width: 640px; }
  .form { max-width: 660px; }
  .form .fields { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; margin-bottom: 18px; }
  .form label { display: block; font-size: 13.5px; font-weight: 600; color: var(--ink); margin-bottom: 14px; }
  .form input, .form select, .form textarea { display: block; width: 100%; margin-top: 6px; padding: 11px 12px; border: var(--bw) solid var(--border); border-radius: var(--radius); font: inherit; background: var(--input-bg); color: var(--ink); }
  .contact-form { margin-top: 8px; }
  .form-title { font-size: 19px; margin: 30px 0 12px; }

  .stars { display: inline-flex; gap: 2px; font-size: 16px; letter-spacing: 1px; }
  .star { color: var(--border); }
  .star.on { color: var(--accent); }
  .review .rtext { margin: 12px 0 14px; color: var(--ink); font-size: 15.5px; }
  .review .rauthor { margin: 0; color: var(--muted); font-size: 13.5px; font-weight: 600; }
  .attrib { margin: 24px 0 0; font-size: 12.5px; color: var(--muted); }

  .faqs { display: grid; gap: 12px; }
  .faqi { border: var(--bw) solid var(--border); border-radius: var(--radius); background: var(--card); padding: 0 20px; }
  .faqi summary { list-style: none; cursor: pointer; padding: 17px 0; font-weight: 600; display: flex; justify-content: space-between; align-items: center; gap: 16px; }
  .faqi summary::-webkit-details-marker { display: none; }
  .faqi summary::after { content: "+"; color: var(--accent); font-size: 22px; font-weight: 400; }
  .faqi[open] summary::after { content: "–"; }
  .faqi p { margin: 0; padding: 0 0 18px; color: var(--muted); }

  .cta-wrap { padding: 0 0 80px; }
  .cta-band { background: linear-gradient(120deg, var(--accent), var(--accent2)); color: var(--on-accent); border-radius: calc(var(--radius) + 8px); padding: 56px 40px; text-align: center; }
  .cta-band h2 { margin: 0 0 10px; }
  .cta-band p { margin: 0 auto 26px; max-width: 520px; opacity: .9; }

  #contact.alt .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 34px; }
  #contact p { color: var(--ink); }
  iframe { width: 100%; height: 330px; border: 0; border-radius: var(--radius); }
  ul.hours { list-style: none; padding: 0; margin: 8px 0 0; color: var(--muted); }

  footer.site { border-top: var(--bw) solid var(--border); padding: 52px 0 0; }
  .foot-grid { display: grid; grid-template-columns: 1.3fr 1fr 1fr; gap: 40px; padding-bottom: 36px; }
  .foot-about { color: var(--muted); font-size: 14.5px; max-width: 300px; }
  footer h4 { margin: 0 0 10px; font-size: 15px; }
  footer p { margin: 4px 0; color: var(--muted); font-size: 14.5px; }
  footer a { color: var(--muted); }
  .copyright { border-top: var(--bw) solid var(--border); padding-top: 18px; padding-bottom: 26px; color: var(--muted); font-size: 13.5px; }

  @media (max-width: 800px) {
    .about, #contact.alt .cols, .hero-split .split, .foot-grid { grid-template-columns: 1fr; }
    .hero { padding: 64px 0; }
    .hero.has-divider { padding-bottom: 120px; }
    .split-art { order: -1; } .monogram { width: 150px; height: 150px; font-size: 60px; }
    .hero-img { max-width: 100%; height: 240px; }
    .row { gap: 18px; }
  }
</style>
</head>
<body>
  <header class="site"><div class="wrap">
    <span class="brand">${esc(content.businessName)}</span>
    <div class="header-actions">
      <nav class="nav">${nav}</nav>
      <a class="btn" href="${primaryHref}">${esc(content.ctaText || s.navContact)}</a>
    </div>
  </div></header>

  ${heroMarkup().replace('class="hero ', t.divider !== "none" ? 'class="hero has-divider ' : 'class="hero ')}
  ${heroBanner}

  ${statsSection}

  ${
    content.about || highlights
      ? `<section id="about"><div class="wrap about">
    <div><h2>${esc(s.about)}</h2><p>${esc(content.about)}</p></div>
    ${highlights ? `<ul class="checks">${highlights}</ul>` : ""}
  </div></section>`
      : ""
  }

  ${servicesSection}

  ${gallerySection}

  ${membershipSection}

  ${bookingSection}

  ${reviewsSection}

  ${faqSection}

  ${ctaBand}

  <section class="alt" id="contact"><div class="wrap">
    <h2>${esc(s.contact)}</h2>
    <div class="cols">
      <div>
        ${addressRow}
        ${phoneRow}
        ${emailRow}
        ${hours ? `<p style="margin-bottom:0"><strong>${esc(s.openingHours)}:</strong></p><ul class="hours">${hours}</ul>` : ""}
        ${contactForm}
      </div>
      <div>${mapEmbed}</div>
    </div>
  </div></section>

  ${footer}
</body>
</html>`;
}
