# 🚀 Sitexa — Launch Checklist

**Live now:** https://lead-finder-saas.vercel.app
Hosted on Vercel (team *Giit up*, auto-deploys from **github.com/lukaslehtimaki-prog/lukas-websit**) · Database on Supabase · Payments via Stripe (**live**)

Legend: **[You]** = you do it · **[Claude]** = ask me and I'll do it · ⏱ = rough time

---

## ✅ Already done
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
- [x] Supabase Site URL + redirect URLs point at the live site
- [x] Real signup + real-card checkout both tested live and working
- [x] `DATABASE_URL` wired up — admin analytics page shows real data (2 tenants, 115 leads, 4 sites as of 2026-07-05)

---

## 🔲 Step 4 — Custom domain (optional, when you buy one) **[You] + [Claude]** ⏱ ~10 min + DNS wait
You're on `lead-finder-saas.vercel.app` for now. When you buy a domain (e.g. `sitexa.ai`):

1. **[You]** Buy it (Namecheap / Cloudflare / GoDaddy). `.ai` ≈ €60–80/yr; `.com`/`.fi` ≈ €10–20/yr.
2. **[Claude]** I add it to Vercel and give you the exact DNS records to paste at your registrar.
3. **[You]** Add those DNS records; wait for it to verify (minutes–hours).
4. **[Claude]** Once live, the site's SEO/preview URLs auto-follow the new domain. I'll also update the Supabase Site URL and the Stripe webhook to the new domain.

> The hero mockup & footer already *display* "sitexa.ai" as the brand — if you land on a different domain, tell me and I'll swap the displayed text.

---

## 🔲 Step 8 — Branded password-reset emails (Resend) — **the last opt-in item** ⏱ ~15 min
Supabase's built-in mailer is unbranded and rate-limited (~a few emails/hour). This one's entirely in your two dashboards — I don't have API access to either — but here's the exact path:

1. **[You]** Create a free account at resend.com (100 emails/day free, no card needed).
2. **[You]** Resend → **Domains** → add your domain and verify it (DNS records — if you don't have a domain yet, skip this and use Resend's shared testing domain temporarily).
3. **[You]** Resend → **API Keys** → create one.
4. **[You]** Supabase → your project → **Project Settings → Auth → SMTP Settings** → enable custom SMTP, host `smtp.resend.com`, port `587`, username `resend`, password = your Resend API key, sender name "Sitexa", sender email from your verified domain.
5. **[You]** Save, then trigger a password reset on the live site to confirm the branded email arrives.

*(Tell me if any screen is confusing and I'll clarify the exact fields.)*

---

## 🔲 When you get your Y-tunnus **[You] + [Claude]**
You mentioned registering as a sole trader via YTJ. Once you have it:
1. **[You]** Tell me — share the Y-tunnus if you want it reflected anywhere.
2. **[Claude]** I'll update the Privacy Policy / Terms with your real business ID.
3. **[You]** *(only if/when you cross Finland's VAT threshold — currently €20,000/year turnover)* register for VAT (ALV), then either add it as a Stripe Tax registration yourself (Settings → Tax → Registrations) or give me the number and I'll add it via the API.

---

## 🔐 Optional hardening, no rush **[You]**
- Your live Stripe **secret key** and the **Vercel deploy token** both passed through this chat. Both still work fine and only grant access to services already wired into your own accounts — low real-world risk. You chose to leave them as-is; revisit anytime via Stripe → API keys (roll) and vercel.com/account/settings/tokens (revoke).
- Your **GitHub PAT** (used once to push + link the repo) can be revoked now if you like — auto-deploy going forward is driven by Vercel's GitHub App, not that token.

---

## 📌 Quick reference
| Item | Value |
|------|-------|
| Live URL | https://lead-finder-saas.vercel.app |
| GitHub repo | github.com/lukaslehtimaki-prog/lukas-websit (auto-deploys `main`) |
| Vercel project | `giit-up/lead-finder-saas` |
| Supabase project ref | `ttnafrcwvcomqsmqicji` |
| Stripe webhook path | `/api/stripe/webhook` |
| Plan IDs (internal) | `pro` = €20 "Standard" · `premium` = €100 "Pro" |
| Helper scripts | `scripts/setup-stripe.mjs`, `rename-stripe-products.mjs`, `verify-billing.mjs`, `provision-trial.mjs` |

**Status (2026-07-05):** the entire original launch backlog is closed. What's left is genuinely optional — a domain (Step 4), branded email (Step 8), and updating legal pages once the business registration lands.
