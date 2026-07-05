# 🚀 Sitovai — Launch Checklist

**Live now:** https://sitovai.com (also reachable at lead-finder-saas.vercel.app)
Hosted on Vercel (team *Giit up*, auto-deploys from **github.com/lukaslehtimaki-prog/lukas-websit**) · Database on Supabase · Payments via Stripe (**live**)

Legend: **[You]** = you do it · **[Claude]** = ask me and I'll do it · ⏱ = rough time

---

## ✅ Launch backlog — fully closed (2026-07-06)
- [x] App deployed & public (deployment protection removed)
- [x] All env vars (Supabase, Google Places, Anthropic, Stripe **live**, `DATABASE_URL`) in production
- [x] Database migration applied (leads, sites, avatar videos)
- [x] SEO: metadata, social preview image, `robots.txt`, `sitemap.xml`
- [x] Legal: `/privacy` + `/terms` (sole trader Lukas Lehtimäki — pending real Y-tunnus), linked from footer + signup
- [x] Live Stripe products, prices, and webhook created and verified
- [x] Stripe Tax enabled (currently €0 VAT — correct, not yet a registered business)
- [x] Dark mode for the dashboard (Settings → Appearance)
- [x] Website builder: unique themes, Google reviews, gym/barber sections, images, one-click publish
- [x] Image upload verified end-to-end (bucket creation + upload + public serving)
- [x] GitHub auto-deploy — push to `main` deploys automatically, verified end-to-end
- [x] All code committed to git, full history on GitHub
- [x] Real signup + real-card checkout both tested live and working
- [x] `DATABASE_URL` wired up — admin analytics page shows real data
- [x] Custom domain **sitovai.com** — bought via Porkbun, DNS configured, live and verified: DNS resolves to Vercel, HTTPS 200, SSL issued, all core pages + sitemap + robots checked
- [x] Stripe webhook moved to `https://sitovai.com/api/stripe/webhook` — same signing secret, verified reachable
- [x] Supabase Site URL + redirect URLs updated to `https://sitovai.com` (per user, 2026-07-06 — not independently verified via API, no Supabase management access from here; low-stakes if off, only affects reset-link targets)

---

## 🔲 Optional — pick up anytime, no urgency

### Branded password-reset emails (Resend) ⏱ ~15 min
Supabase's built-in mailer is unbranded and rate-limited. Entirely in your two dashboards — no API access from here.
1. Free account at resend.com (100 emails/day free, no card).
2. Resend → **Domains** → add + verify yours (or use their shared testing domain temporarily).
3. Resend → **API Keys** → create one.
4. Supabase → **Project Settings → Auth → SMTP Settings** → enable custom SMTP: host `smtp.resend.com`, port `587`, username `resend`, password = your Resend API key, sender name "Sitovai", sender email from your verified domain.
5. Save, then trigger a password reset on the live site to confirm the branded email arrives.

### When you get your Y-tunnus
1. **[You]** Tell me — share the Y-tunnus if you want it reflected anywhere.
2. **[Claude]** I'll update the Privacy Policy / Terms with your real business ID.
3. **[You]** *(only if/when you cross Finland's VAT threshold — currently €20,000/year)* register for VAT (ALV), then either add it as a Stripe Tax registration yourself or give me the number and I'll add it via the API.

### Security hygiene, no rush
- Your live Stripe **secret key**, the **Vercel deploy token**, and a **GitHub PAT** all passed through this chat. All still work fine and only grant access to services already wired into your own accounts — you chose to leave them as-is. Revisit anytime: Stripe → API keys (roll), vercel.com/account/settings/tokens (revoke), GitHub → Settings → Personal access tokens (revoke — auto-deploy runs on Vercel's GitHub App now, not this token).

---

## 📌 Quick reference
| Item | Value |
|------|-------|
| Live URL | https://sitovai.com |
| GitHub repo | github.com/lukaslehtimaki-prog/lukas-websit (auto-deploys `main`) |
| Vercel project | `giit-up/lead-finder-saas` |
| Supabase project ref | `ttnafrcwvcomqsmqicji` |
| Stripe webhook path | `/api/stripe/webhook` |
| Plan IDs (internal) | `pro` = €20 "Standard" · `premium` = €100 "Pro" |
| Helper scripts | `scripts/setup-stripe.mjs`, `rename-stripe-products.mjs`, `verify-billing.mjs`, `provision-trial.mjs` |

**Status:** Sitovai is fully live at its real domain, with billing, tax, dark mode, the full website builder, and CI/CD all working. Everything left is optional polish.
