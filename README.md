# Sitovai

Find Finnish local businesses that **don't have a website**, then **generate one for them with AI** — a multi-tenant SaaS for freelancers, agencies, and marketers.

- **Lead Finder** — search a niche + location, pull candidates from the **Google Places API (New)**, cross-reference the **PRH / YTJ** business registry, and flag each lead by website status. Filter, track (lightweight CRM), and export to CSV.
- **AI Website Builder** — pick a lead (or paste a Google Maps link), let **Claude** write Finnish copy from the real business data, fill a responsive template, preview & edit live, and download a ready-to-launch single-page site.
- **Multi-tenant** — Supabase Auth + Postgres **Row-Level Security**: every lead, search, and site is scoped to a tenant. Plans, usage limits, and a platform-admin view are built in (billing is intentionally deferred).

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Supabase (Postgres + Auth + RLS) · Drizzle (schema/admin) · Anthropic Claude · Google Places API (New).

---

## Setup (≈15 minutes)

Node.js is already managed via nvm. From the project folder:

### 1. Supabase project
1. Create a free project at [supabase.com](https://supabase.com).
2. **Project Settings → API**: copy the **Project URL**, the **anon** key, and the **service_role** key.
3. **Project Settings → Database → Connection string**: copy the **Transaction** pooler URI (port `6543`) and the **direct** URI (port `5432`).
4. **Authentication → URL Configuration**: set **Site URL** to `http://localhost:3000` and add `http://localhost:3000/auth/callback` to **Redirect URLs**.
5. *(For fastest local testing)* **Authentication → Providers → Email**: turn **off** "Confirm email" so sign-up logs you straight in. (Leave it on for production and configure SMTP.)

### 2. Create the database
Open **SQL Editor** in Supabase and paste + **Run** each migration in order: [`0001_init.sql`](supabase/migrations/0001_init.sql), [`0002_billing.sql`](supabase/migrations/0002_billing.sql), [`0003_avatar_videos.sql`](supabase/migrations/0003_avatar_videos.sql). Together they create all tables, the RLS policies, the signup trigger (auto-provisions a tenant per new user), the plan seeds, and the private `avatar-videos` storage bucket.

### 3. Google Places API key
1. In [Google Cloud Console](https://console.cloud.google.com), create/select a project and enable billing.
2. **APIs & Services → Library**: enable **Places API (New)** and **Geocoding API**.
3. **Credentials → Create API key**. Restrict it to those two APIs. This key is used server-side only.

### 4. Anthropic API key
Create a key at [console.anthropic.com](https://console.anthropic.com) → **API Keys**.

### 5. Environment variables
```bash
cp .env.example .env.local
```
Fill in every value in `.env.local` (Supabase URL/keys, both DB URLs, `GOOGLE_MAPS_API_KEY`, `ANTHROPIC_API_KEY`). Then add **your email** to `PLATFORM_ADMIN_EMAILS` — that's all it takes to become the platform owner and see the **Admin** view.

### 6. Run
```bash
npm run dev
```
Open **http://localhost:3000**, click **Get started**, and sign up. Your tenant is created automatically; because your email is in `PLATFORM_ADMIN_EMAILS`, you'll also see the Admin tab. That's it — the product is ready to use.

> The app boots fine without any keys (landing + auth render), but searching needs the Google key, AI copy needs the Anthropic key, and everything else needs Supabase.

---

## Cost notes (Google Places)

The Places client is **cost-optimized**. Searches request only **Pro-tier** fields (incl. `websiteUri`, which gives the no-website signal). Phone numbers and opening hours are **Enterprise-tier** fields, so they're fetched **on demand** via Place Details only when you build a site for a specific lead — not for every search result. One Text Search request (≤20 results) is one billable event; the builder paginates up to ~40 results. Verify current pricing at the [Google Maps pricing list](https://developers.google.com/maps/billing-and-pricing/pricing) before scaling search volume.

## Project structure

```
src/lib/places/      Google Places (New) client  — Text Search (Pro) + Place Details (on-demand)
src/lib/ytj/         PRH/YTJ registry client     — resilient, defensive parsing
src/lib/leads/       matching                    — Places ⇄ registry cross-reference
src/lib/ai/          Anthropic client + Finnish website-copy + video sales-script generation
src/lib/templates/   site content types + pure HTML renderer (3 templates)
src/lib/video/       avatar-video providers (HeyGen / demo mock) + presets + storage
src/lib/db/          Drizzle schema (mirrors the SQL) + service-role admin client
src/lib/supabase/    browser / server / proxy clients (RLS-enforced runtime access)
src/lib/usage.ts     monthly usage counting + plan-limit checks
src/app/dashboard/   leads · sites · videos · usage · admin
supabase/migrations/ canonical SQL (tables + RLS + signup trigger + seeds)
```
The Places, YTJ, and AI modules are deliberately isolated and independently testable — each is the most likely to need tuning (rate limits/cost, match accuracy, prompt quality).

## Scripts
```bash
npm run dev      # dev server (http://localhost:3000)
npm run build    # production build
npm start        # serve the production build
npm run lint     # eslint
```

## Deploy (later)
Deploy to **Vercel**: import the repo, add all `.env.local` values as Environment Variables, and set the Supabase **Site URL / Redirect URLs** to your production domain. The Supabase project and API keys stay the same.

## Deferred / roadmap
- **Billing**: plan + usage tables and limits exist; wiring Stripe is a later step.
- **Email/phone enrichment for leads**: not available from Places or YTJ — a future paid-enrichment integration or manual step.
- **Map picker**: location is currently text + radius (geocoded server-side); a Google map picker is a planned enhancement.
- **Natural-language search**: the composer uses structured niche/location today; a Claude-powered free-text parser can be layered on.

🤖 Built with [Claude Code](https://claude.com/claude-code)
