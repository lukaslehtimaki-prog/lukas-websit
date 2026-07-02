import { templateMeta, type SiteContent } from "./types";

// Pure renderer (safe to import on client or server). Produces a complete, standalone,
// mobile-responsive HTML document for a single-page small-business site.

function esc(value: string | null | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderSiteToHtml(content: SiteContent, templateId: string): string {
  const t = templateMeta(templateId);
  const accent = t.accent;
  const c = content.contact;

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

  return `<!DOCTYPE html>
<html lang="fi">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(content.businessName)}</title>
<style>
  :root { --accent: ${accent}; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: ${t.font}; color: #1d1d22; line-height: 1.6; }
  a { color: var(--accent); }
  .wrap { max-width: 1024px; margin: 0 auto; padding: 0 24px; }
  header.site { position: sticky; top: 0; background: rgba(255,255,255,.92); backdrop-filter: blur(6px); border-bottom: 1px solid #eee; z-index: 10; }
  header.site .wrap { display: flex; align-items: center; justify-content: space-between; height: 64px; }
  .brand { font-weight: 700; font-size: 20px; }
  .btn { display: inline-block; background: var(--accent); color: #fff; padding: 12px 20px; border-radius: 10px; text-decoration: none; font-weight: 600; }
  .hero { padding: 88px 0; background: linear-gradient(135deg, ${accent}14, ${accent}05); }
  .hero h1 { font-size: clamp(32px, 5vw, 52px); line-height: 1.1; margin: 0 0 16px; }
  .hero p { font-size: 19px; max-width: 620px; color: #44444c; }
  .tagline { text-transform: uppercase; letter-spacing: .12em; font-size: 13px; font-weight: 700; color: var(--accent); margin: 0 0 12px; }
  section { padding: 64px 0; }
  section h2 { font-size: 30px; margin: 0 0 24px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; }
  .card { border: 1px solid #ececf0; border-radius: 14px; padding: 22px; background: #fff; }
  .card h3 { margin: 0 0 8px; color: var(--accent); font-size: 18px; }
  .card p { margin: 0; color: #55555d; }
  .about { display: grid; grid-template-columns: 1.4fr 1fr; gap: 40px; align-items: start; }
  ul.checks { list-style: none; padding: 0; margin: 0; }
  ul.checks li { padding: 8px 0 8px 28px; position: relative; }
  ul.checks li::before { content: "✓"; position: absolute; left: 0; color: var(--accent); font-weight: 700; }
  .contact { background: #fafafb; }
  .contact .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
  iframe { width: 100%; height: 320px; border: 0; border-radius: 14px; }
  ul.hours { list-style: none; padding: 0; margin: 8px 0 0; color: #55555d; }
  footer.site { padding: 32px 0; border-top: 1px solid #eee; color: #88888f; font-size: 14px; text-align: center; }
  @media (max-width: 760px) { .about, .contact .cols { grid-template-columns: 1fr; } .hero { padding: 56px 0; } }
</style>
</head>
<body>
  <header class="site"><div class="wrap">
    <span class="brand">${esc(content.businessName)}</span>
    <a class="btn" href="#contact">${esc(content.ctaText || "Ota yhteyttä")}</a>
  </div></header>

  <div class="hero"><div class="wrap">
    ${content.tagline ? `<p class="tagline">${esc(content.tagline)}</p>` : ""}
    <h1>${esc(content.heroHeading || content.businessName)}</h1>
    <p>${esc(content.heroSubtext)}</p>
    <p style="margin-top:28px"><a class="btn" href="#contact">${esc(content.ctaText || "Ota yhteyttä")}</a></p>
  </div></div>

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
      ? `<section style="background:#fafafb"><div class="wrap">
    <h2>Palvelut</h2>
    <div class="grid">${services}</div>
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
