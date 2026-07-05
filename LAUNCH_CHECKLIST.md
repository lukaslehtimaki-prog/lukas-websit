# 🚀 Sitexa — Launch Checklist

**Live now:** https://lead-finder-saas.vercel.app
Hosted on Vercel (team *Giit up*) · Database on Supabase · Payments via Stripe (test mode)

Legend: **[You]** = you do it · **[Claude]** = ask me and I'll do it · ⏱ = rough time

---

## ✅ Already done
- [x] App deployed & public (deployment protection removed)
- [x] All env vars (Supabase, Google Places, Anthropic, Stripe **live**) in production
- [x] Database migration applied (leads, sites, avatar videos)
- [x] SEO: metadata, social preview image, `robots.txt`, `sitemap.xml`
- [x] Legal: `/privacy` + `/terms` (sole trader Lukas Lehtimäki), linked from footer + signup
- [x] Live Stripe products, prices, and webhook created and verified
- [x] Dark mode for the dashboard (Settings → Appearance)
- [x] Website builder: unique themes, Google reviews, gym/barber sections, images, one-click publish
- [x] Image upload verified end-to-end (bucket creation + upload + public serving)
- [x] All code committed to git (was sitting uncommitted since launch — fixed 2026-07-05)
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

### 🔲 One thing left for you **[You]** ⏱ 3 min
- Log into the live site → **Billing** → start a plan with a **real card** and confirm it activates. Because there's a 7-day trial, **no charge happens now** — you can cancel immediately from the billing portal to be safe. This is the one step only you can do (needs your browser + a real card).

### 🔐 Optional hardening **[You]**
- Your live **secret key** passed through chat. It's working in Vercel, but if you want zero chat exposure: Stripe → Developers → API keys → **roll** `sk_live…`, then paste the new one into **Vercel → Settings → Environment Variables → `STRIPE_SECRET_KEY`**, and tell me to redeploy. (Optional — not urgent.)
- Same idea for the **Vercel deploy token** you pasted — revoke it at vercel.com/account/settings/tokens once you don't need me deploying for a while (see Step 6).

---

## 🔲 Step 3b — Stripe Tax / VAT (optional, deferred earlier) **[You] + [Claude]** ⏱ ~10 min
Now that payments are live, this is worth closing out. Stripe Tax auto-calculates and collects VAT (~0.5% fee per transaction).

1. **[You]** Stripe Dashboard → **Settings → Tax** → enable, set your origin address (Finland), register the jurisdiction(s) you'll sell into.
2. **[Claude]** Once enabled, I add automatic tax + VAT-ID collection to checkout (~10 lines) and redeploy.

---

## 🔲 Step 4 — Custom domain (optional, when you buy one) **[You] + [Claude]** ⏱ ~10 min + DNS wait
You're on `lead-finder-saas.vercel.app` for now. When you buy a domain (e.g. `sitexa.ai`):

1. **[You]** Buy it (Namecheap / Cloudflare / GoDaddy). `.ai` ≈ €60–80/yr; `.com`/`.fi` ≈ €10–20/yr.
2. **[Claude]** I add it to Vercel and give you the exact DNS records to paste at your registrar.
3. **[You]** Add those DNS records; wait for it to verify (minutes–hours).
4. **[Claude]** Once live, the site's SEO/preview URLs auto-follow the new domain. I'll also update the Supabase Site URL and the Stripe webhook to the new domain.

> The hero mockup & footer already *display* "sitexa.ai" as the brand — if you land on a different domain, tell me and I'll swap the displayed text.

---

## 🔲 Step 5 — GitHub auto-deploy — **you picked this** ⏱ ~10 min
Right now I deploy manually via the Vercel CLI. This gives you a cloud backup of the code + auto-deploy on every push. Two parts, split by what only you can do (no GitHub CLI or stored credentials on this machine, and connecting Vercel to GitHub requires a browser OAuth step only you can click):

1. **[You]** Create an empty GitHub repo (github.com/new — no README/gitignore, just the empty repo).
2. **[You]** Create a GitHub **fine-grained personal access token** (github.com/settings/personal-access-tokens/new) scoped to just that repo, permission **Contents: Read and write**. Paste the repo URL + token to me like you did for Vercel.
3. **[Claude]** I push the current code to that repo.
4. **[You]** In Vercel → your project → **Settings → Git** → **Connect Git Repository** → pick the repo (one click; this is the browser-OAuth step I can't do for you).
5. **[Claude]** Once connected, all future changes deploy automatically on push — no more manual `vercel --prod` needed.

---

## 🔲 Step 6 — Cleanup (once you're happy) **[You]**
- Revoke the temporary Vercel token: https://vercel.com/account/settings/tokens → delete `sitexa-deploy`.
  *(Do this only when you don't need me to deploy again for a while — I'd need a fresh one next time.)*

---

## 🔲 Step 7 — Admin analytics page — **you picked this** ⏱ 2 min
Shows a friendly "not configured" notice instead of tenant/usage stats until this is set.

1. **[You]** Supabase → your project → **Connect** button (top of dashboard) → **ORMs / URI** tab → copy the connection string, replace `[YOUR-PASSWORD]` with your DB password. Paste it to me.
2. **[Claude]** I add it to Vercel as `DATABASE_URL` (+ `DIRECT_URL`) and redeploy. The Admin page will show real tenant/usage data.

---

## 🔲 Step 8 — Branded password-reset emails (Resend) — **you picked this** ⏱ ~15 min
Supabase's built-in mailer is unbranded and rate-limited (~a few emails/hour). This part is entirely in your two dashboards — I don't have API access to either, so I can't do this one for you, but here's the exact path:

1. **[You]** Create a free account at resend.com (100 emails/day free, no card needed).
2. **[You]** Resend → **Domains** → add your domain and verify it (DNS records — if you don't have a domain yet, skip this and use Resend's shared testing domain temporarily).
3. **[You]** Resend → **API Keys** → create one.
4. **[You]** Supabase → your project → **Project Settings → Auth → SMTP Settings** → enable custom SMTP, host `smtp.resend.com`, port `587`, username `resend`, password = your Resend API key, sender name "Sitexa", sender email from your verified domain.
5. **[You]** Save, then trigger a password reset on the live site to confirm the branded email arrives.

*(Tell me if any screen is confusing and I'll clarify the exact fields.)*

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

**Priority order (2026-07-05):** Steps 1 & 2 first (3 min total, genuinely pending). Then whichever of 3b/5/7/8 you want to tackle — all need a few minutes in an external dashboard from you before I can finish my part. Step 4 (custom domain) intentionally paused until this backlog clears.
