# 🚀 Sitexa — Launch Checklist

**Live now:** https://lead-finder-saas.vercel.app
Hosted on Vercel (team *Giit up*) · Database on Supabase · Payments via Stripe (test mode)

Legend: **[You]** = you do it · **[Claude]** = ask me and I'll do it · ⏱ = rough time

---

## ✅ Already done
- [x] App deployed & public (deployment protection removed)
- [x] All env vars (Supabase, Google Places, Anthropic, Stripe test) live in production
- [x] Database migration applied (leads, sites, avatar videos)
- [x] SEO: metadata, social preview image, `robots.txt`, `sitemap.xml`
- [x] Legal: `/privacy` + `/terms` (sole trader Lukas Lehtimäki), linked from footer + signup
- [x] Verified: landing, login, signup, dashboard-guard all working

---

## 🔲 Step 1 — Point Supabase at the live site **[You]** ⏱ 1 min
Without this, password-reset emails point to the wrong place. (Login & signup already work.)

1. Open: https://supabase.com/dashboard/project/ttnafrcwvcomqsmqicji/auth/url-configuration
2. **Site URL** → `https://lead-finder-saas.vercel.app`
3. **Redirect URLs** → click *Add URL* → `https://lead-finder-saas.vercel.app/**`
4. **Save**

---

## 🔲 Step 2 — Do the first real signup **[You]** ⏱ 2 min
This is the true end-to-end test.

1. Go to https://lead-finder-saas.vercel.app/signup
2. Create an account (your email + a password).
3. You should land in the dashboard. Because your email is a **platform admin**, you get full access regardless of plan.
4. Try a lead search (e.g. "barbershop" / "Helsinki") to confirm Google Places + the database work in production.

> If anything errors, tell me the message and I'll fix it.

---

## ✅ Step 3 — Real Stripe payments — **DONE (live, 2026-07-04)**
Account activated (FI / EUR, charges + payouts enabled). Live products **Sitexa Standard €20** and **Sitexa Pro €100**, live webhook, and all 5 live keys are in Vercel production and verified. The site now accepts **real** cards.

### 3d. One thing left for you **[You]** ⏱ 3 min
- Log into the live site → **Billing** → start a plan with a **real card** and confirm it activates. Because there's a 7-day trial, **no charge happens now** — you can cancel immediately from the billing portal to be safe.

### 🔐 Optional hardening **[You]**
- Your live **secret key** passed through chat. It's working in Vercel, but if you want zero chat exposure: Stripe → Developers → API keys → **roll** `sk_live…`, then paste the new one into **Vercel → Settings → Environment Variables → `STRIPE_SECRET_KEY`**, and tell me to redeploy. (Optional — not urgent.)

---

## 🔲 Step 4 — Custom domain (optional, when you buy one) **[You] + [Claude]** ⏱ ~10 min + DNS wait
You're on `lead-finder-saas.vercel.app` for now. When you buy a domain (e.g. `sitexa.ai`):

1. **[You]** Buy it (Namecheap / Cloudflare / GoDaddy). `.ai` ≈ €60–80/yr; `.com`/`.fi` ≈ €10–20/yr.
2. **[Claude]** I add it to Vercel and give you the exact DNS records to paste at your registrar.
3. **[You]** Add those DNS records; wait for it to verify (minutes–hours).
4. **[Claude]** Once live, the site's SEO/preview URLs auto-follow the new domain. I'll also update the Supabase Site URL and the Stripe webhook to the new domain.

> The hero mockup & footer already *display* "sitexa.ai" as the brand — if you land on a different domain, tell me and I'll swap the displayed text.

---

## 🔲 Step 5 — GitHub auto-deploy (optional) **[You] + [Claude]** ⏱ ~10 min
Right now I deploy manually via the Vercel CLI. If you want every change to deploy automatically and have a cloud backup of the code:

1. **[You]** Create a GitHub account/repo (or tell me and I'll guide the exact clicks).
2. **[Claude]** I push the code and connect the repo to Vercel so pushes auto-deploy.

*(Not required — the site runs fine without this.)*

---

## 🔲 Step 6 — Cleanup (once you're happy) **[You]**
- Revoke the temporary Vercel token: https://vercel.com/account/settings/tokens → delete `sitexa-deploy`.
  *(Do this only when you don't need me to deploy again for a while — I'd need a fresh one next time.)*

---

## 📌 Quick reference
| Item | Value |
|------|-------|
| Live URL | https://lead-finder-saas.vercel.app |
| Vercel project | `giit-up/lead-finder-saas` |
| Supabase project ref | `ttnafrcwvcomqsmqicji` |
| Stripe webhook path | `/api/stripe/webhook` |
| Plan IDs (internal) | `pro` = €20 "Standard" · `premium` = €100 "Pro" |
| Helper scripts | `scripts/setup-stripe.mjs`, `rename-stripe-products.mjs`, `verify-billing.mjs`, `provision-trial.mjs` |

**Priority order:** Step 1 → Step 2 today (2 min total). Step 3 whenever Stripe is approved. Steps 4–6 whenever you like.
