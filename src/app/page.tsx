import Link from "next/link";
import {
  Search,
  ShieldCheck,
  Globe,
  Users,
  Check,
  ArrowRight,
  ArrowUpRight,
  MapPin,
  FileSpreadsheet,
  Plus,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { AuroraBackdrop } from "@/components/ui/aether-hero";
import { BrandMark } from "@/components/ui/brand";
import {
  Tilt3D,
  ParticleField,
  Reveal,
  SpotCard,
  ParallaxDrift,
} from "@/components/ui/wow";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[#05060a] text-zinc-100 selection:bg-indigo-500/30">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <LogosStrip />
        <Features />
        <HowItWorks />
        <Pricing />
        <Faq />
        <CtaBand />
      </main>
      <SiteFooter />
    </div>
  );
}

/* ---------------------------------- shared ---------------------------------- */

function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "font-display flex items-center gap-2.5 text-[16px] font-semibold tracking-tight text-white",
        className,
      )}
    >
      <BrandMark size={28} className="rounded-[7px]" />
      Sitovai
    </Link>
  );
}

const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-[10px] bg-zinc-100 font-semibold text-[#05060a] transition-all duration-150 hover:-translate-y-px hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60";
const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-[10px] border border-white/15 bg-white/[0.04] font-semibold text-zinc-100 backdrop-blur transition-all duration-150 hover:border-white/25 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
      {children}
    </p>
  );
}

/** Editorial section head: title left, description right. */
function SectionHead({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-12 flex flex-wrap items-end justify-between gap-x-16 gap-y-5">
      <div className="max-w-xl">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="font-display mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          {title}
        </h2>
      </div>
      {subtitle ? (
        <p className="max-w-sm text-[15px] leading-7 text-zinc-500">{subtitle}</p>
      ) : null}
    </div>
  );
}

/* ---------------------------------- header ---------------------------------- */

function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#05060a]/60 backdrop-blur-xl">
      <Container className="flex h-16 items-center justify-between">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm text-zinc-400 md:flex">
          {[
            ["#features", "Features"],
            ["#how", "How it works"],
            ["#pricing", "Pricing"],
            ["#faq", "FAQ"],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="rounded-md transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden h-9 items-center rounded-[10px] px-3.5 text-sm font-medium text-zinc-300 transition hover:text-white sm:inline-flex"
          >
            Sign in
          </Link>
          <Link href="/signup" className={cn(btnPrimary, "h-9 px-4 text-sm")}>
            Get started
          </Link>
        </div>
      </Container>
    </header>
  );
}

/* ----------------------------------- hero ----------------------------------- */

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-white/[0.07]">
      {/* backdrop — animated CSS aurora pushed to the right + grid + scrim */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <ParallaxDrift strength={22} className="absolute inset-[-3%]">
          <AuroraBackdrop className="opacity-70" />
        </ParallaxDrift>
        <div className="absolute inset-0 bg-grid-dark bg-grid-fade opacity-25" />
        <ParticleField count={80} />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,6,10,0.88)_0%,rgba(5,6,10,0.55)_40%,rgba(5,6,10,0.25)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[#05060a]" />
      </div>

      <Container className="relative z-10">
        <div className="grid items-center gap-14 py-24 sm:py-28 lg:min-h-[88vh] lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:py-20">
          {/* copy */}
          <div className="max-w-2xl">
            <div className="animate-fade-up">
              <span className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-[#0c0e15]/70 px-4 py-1.5 text-[12.5px] font-medium text-zinc-400 backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_0_3px_rgba(52,211,153,0.15)]" />
                Live · lead finder + AI website builder
              </span>
            </div>

            <h1
              className="font-display animate-fade-up mt-7 text-balance text-5xl font-bold leading-[1.02] tracking-tight sm:text-6xl xl:text-7xl"
              style={{ animationDelay: "60ms" }}
            >
              Find businesses with no website.{" "}
              <span className="text-gradient">Build them one with AI.</span>
            </h1>

            <p
              className="animate-fade-up mt-7 max-w-xl text-lg leading-8 text-zinc-400"
              style={{ animationDelay: "120ms" }}
            >
              Sitovai scans Google Places worldwide, enriches every lead with
              registry data, and turns the best ones into ready-to-launch
              websites — written in the business&apos;s own language.
            </p>

            <div
              className="animate-fade-up mt-9 flex flex-wrap items-center gap-3"
              style={{ animationDelay: "180ms" }}
            >
              <Link href="/signup" className={cn(btnPrimary, "h-12 px-7 text-[15px]")}>
                Get started <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#how" className={cn(btnGhost, "h-12 px-7 text-[15px]")}>
                See how it works
              </a>
            </div>

            {/* inline stat strip replaces the old stats band */}
            <dl
              className="animate-fade-up mt-12 flex flex-wrap gap-x-10 gap-y-6 border-t border-white/[0.07] pt-7"
              style={{ animationDelay: "240ms" }}
            >
              {[
                ["~40", "leads per search"],
                ["< 60 s", "lead to draft site"],
                ["10", "site languages"],
              ].map(([v, l]) => (
                <div key={l}>
                  <dt className="sr-only">{l}</dt>
                  <dd className="font-display text-2xl font-semibold tracking-tight text-white">
                    {v}
                  </dd>
                  <dd className="mt-1 text-[13px] text-zinc-500">{l}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* product window — pointer-tracked 3D tilt */}
          <div className="animate-fade-up lg:pl-2" style={{ animationDelay: "200ms" }}>
            <Tilt3D className="relative">
              <HeroPreview />
            </Tilt3D>
          </div>
        </div>
      </Container>
    </section>
  );
}

function HeroPreview() {
  const rows = [
    {
      name: "Parturi-Kampaamo Aalto",
      area: "Tampere",
      yt: "3312445-1",
    },
    {
      name: "Kahvila Siilinjärvi",
      area: "Kuopio",
      yt: "2988771-4",
    },
    {
      name: "Autohuolto Mäkinen",
      area: "Lahti",
      yt: "3120997-8",
    },
  ];
  return (
    <div className="relative">
      <div className="pointer-events-none absolute -inset-x-6 -inset-y-8 rounded-[36px] bg-[radial-gradient(closest-side,rgba(99,102,241,0.16),transparent)] blur-2xl" />

      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0b0c12]/90 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)] backdrop-blur">
        {/* window chrome */}
        <div className="flex items-center gap-2 border-b border-white/[0.06] bg-white/[0.02] px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="ml-3 rounded-md bg-white/5 px-3 py-1 font-mono text-[11px] text-zinc-500 ring-1 ring-white/10">
            sitovai.com/dashboard/leads
          </span>
        </div>

        <div className="p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
              <MapPin className="h-4 w-4 text-indigo-400" /> Barbershops · Tampere ·
              5&nbsp;km
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              12 leads found
            </span>
          </div>

          <div className="overflow-hidden rounded-xl border border-white/[0.06]">
            <div className="grid grid-cols-[1.5fr_0.8fr_auto] gap-2 border-b border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-500">
              <span>Business</span>
              <span>Registry</span>
              <span />
            </div>
            {rows.map((r) => (
              <div
                key={r.yt}
                className="grid grid-cols-[1.5fr_0.8fr_auto] items-center gap-2 px-4 py-3.5 text-sm [&:not(:last-child)]:border-b [&:not(:last-child)]:border-white/[0.06]"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium text-zinc-200">{r.name}</div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500">
                    {r.area}
                    <span className="inline-flex items-center rounded-full border border-amber-400/20 bg-amber-500/10 px-2 py-px text-[10.5px] font-medium text-amber-300">
                      No website
                    </span>
                  </div>
                </div>
                <span className="font-mono text-xs text-emerald-400">{r.yt}</span>
                <span className="inline-flex items-center gap-1.5 rounded-[8px] bg-zinc-100 px-2.5 py-1.5 text-xs font-semibold text-[#05060a]">
                  Build site <ArrowUpRight className="h-3 w-3" />
                </span>
              </div>
            ))}
          </div>

          {/* generation status line */}
          <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-[13px] text-zinc-400">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-emerald-500/15 text-emerald-300">
              <Check className="h-3.5 w-3.5" />
            </span>
            kahvila-siilinjarvi.fi drafted in 42 s
            <span className="ml-auto font-mono text-[11px] text-zinc-600">
              fi · Moderni
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- logos strip -------------------------------- */

function LogosStrip() {
  const items = [
    "Google Places API",
    "YTJ / PRH Registry",
    "Claude AI",
    "Supabase",
    "Stripe",
  ];
  const row = [...items, ...items];
  return (
    <section className="border-b border-white/[0.07] py-8">
      <Container className="flex flex-wrap items-center gap-x-10 gap-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-600">
          Powered by
        </p>
        <div
          className="min-w-0 flex-1 overflow-hidden"
          style={{
            maskImage:
              "linear-gradient(to right, transparent, #000 10%, #000 90%, transparent)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent, #000 10%, #000 90%, transparent)",
          }}
        >
          <div className="animate-marquee flex w-max items-center gap-14 pr-14">
            {row.map((i, idx) => (
              <span
                key={`${i}-${idx}`}
                className="whitespace-nowrap text-sm font-medium text-zinc-600"
              >
                {i}
              </span>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

/* --------------------------------- features --------------------------------- */

const FEATURES = [
  {
    icon: Search,
    title: "Chat-style lead finder",
    body: "Describe a niche and a location. Sitovai queries Google Places and returns a clean list with website status detected instantly.",
    wide: true,
  },
  {
    icon: Globe,
    title: "AI website builder",
    body: "Turn a lead into a mobile-ready site in seconds — in the business's own language. Preview live, edit inline, export.",
    wide: true,
  },
  {
    icon: ShieldCheck,
    title: "Registry cross-check",
    body: "Finnish leads are matched to the official YTJ registry — business ID, industry code, registration date.",
  },
  {
    icon: Users,
    title: "Built-in CRM",
    body: "Track lead status from new to won, invite your team, and keep every workspace isolated.",
  },
  {
    icon: FileSpreadsheet,
    title: "One-click export",
    body: "Download any lead list as CSV for your outreach tool, or export a finished site as ready-to-host files.",
  },
] as const;

function Features() {
  return (
    <section id="features" className="scroll-mt-20 border-b border-white/[0.07] py-24">
      <Container>
        <Reveal>
          <SectionHead
            eyebrow="Product"
            title="From cold search to shipped website"
            subtitle="The full workflow a freelancer or agency needs to find local businesses and win them as clients."
          />
        </Reveal>

        <div className="grid gap-4 lg:grid-cols-6">
          {FEATURES.map((f, i) => (
            <Reveal
              key={f.title}
              delay={i * 70}
              className={cn("wide" in f && f.wide ? "lg:col-span-3" : "lg:col-span-2")}
            >
              <SpotCard className="group h-full rounded-2xl border border-white/[0.08] bg-[#0b0c12] p-7 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-300/25 hover:bg-[#0d0e16]">
                <div className="flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-[11px] border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent text-indigo-300">
                    <f.icon className="h-5 w-5" />
                  </span>
                  <span className="font-display text-[13px] font-semibold text-zinc-700 transition group-hover:text-indigo-400/70">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="font-display mt-5 text-lg font-semibold tracking-tight text-white">
                  {f.title}
                </h3>
                <p className="mt-2 text-[15px] leading-7 text-zinc-500">{f.body}</p>
              </SpotCard>
            </Reveal>
          ))}

          {/* filler card with CTA to keep the grid balanced */}
          <Reveal delay={FEATURES.length * 70} className="lg:col-span-2">
            <Link
              href="/signup"
              className="group relative flex h-full flex-col justify-between rounded-2xl border border-indigo-400/25 bg-gradient-to-b from-indigo-500/[0.12] to-transparent p-7 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-300/40"
            >
              <p className="font-display text-lg font-semibold tracking-tight text-white">
                Try it on your own town
              </p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-indigo-300">
                Start a search
                <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            </Link>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

/* -------------------------------- how it works ------------------------------ */

function HowItWorks() {
  const steps = [
    {
      title: "Describe your target",
      body: "Type a niche and a town, set a radius. Sitovai queries Google Places behind the scenes.",
    },
    {
      title: "Get qualified leads",
      body: "See who has no website, enriched with registry data where available. Filter, tag, and export.",
    },
    {
      title: "Ship their website",
      body: "Generate a polished site in the local language from real business data. Preview, tweak, hand it over.",
    },
  ];
  return (
    <section id="how" className="scroll-mt-20 border-b border-white/[0.07] py-24">
      <Container>
        <Reveal>
          <SectionHead
            eyebrow="How it works"
            title="Three steps to a new client"
            subtitle="No scraping, no spreadsheets — the whole pipeline lives in one dashboard."
          />
        </Reveal>
        <div className="grid gap-x-10 gap-y-12 md:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s.title} delay={i * 110}>
              <div className="border-t border-white/[0.09] pt-6">
                <div className="font-display text-[13px] font-semibold text-indigo-400">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="font-display mt-3 text-xl font-semibold tracking-tight text-white">
                  {s.title}
                </h3>
                <p className="mt-2.5 text-[15px] leading-7 text-zinc-500">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ---------------------------------- pricing --------------------------------- */

const TIERS = [
  {
    name: "Standard",
    price: "€20",
    period: "/month",
    desc: "For freelancers and solo marketers.",
    cta: "Get started",
    href: "/signup?plan=pro",
    highlight: true,
    badge: "Most popular",
    features: [
      "50 lead searches / month",
      "15 AI websites / month",
      "Website message inbox",
      "1 seat",
      "Registry cross-check (FI)",
      "CSV export",
    ],
  },
  {
    name: "Pro",
    price: "€100",
    period: "/month",
    desc: "For agencies running at scale.",
    cta: "Get started",
    href: "/signup?plan=premium",
    highlight: false,
    features: [
      "5,000 lead searches / month",
      "500 AI websites / month",
      "AI pitch emails with one-click buy",
      "5 team seats",
      "Priority AI generation",
      "Everything in Standard",
    ],
  },
] as const;

function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-20 border-b border-white/[0.07] py-24">
      <Container>
        <Reveal>
          <SectionHead
            eyebrow="Pricing"
            title="Simple, transparent plans"
            subtitle="Pick a plan and start today from €20/month. Cancel whenever you like — payments handled by Stripe."
          />
        </Reveal>
        <div className="grid max-w-4xl gap-4 sm:grid-cols-2">
          {TIERS.map((t, ti) => (
            <Reveal key={t.name} delay={ti * 120}>
            <div
              className={cn(
                "relative flex h-full flex-col rounded-2xl border p-8",
                t.highlight
                  ? "grad-border border-indigo-400/35 bg-gradient-to-b from-indigo-500/[0.12] to-transparent"
                  : "border-white/[0.08] bg-[#0b0c12]",
              )}
            >
              {"badge" in t && t.badge ? (
                <span className="absolute -top-3 left-8 rounded-full border border-indigo-400/40 bg-[#0b0c17] px-3 py-1 text-xs font-semibold text-indigo-300">
                  {t.badge}
                </span>
              ) : null}
              <h3 className="font-display text-lg font-semibold text-white">{t.name}</h3>
              <p className="mt-1 text-sm text-zinc-500">{t.desc}</p>
              <div className="mt-6 flex items-baseline gap-1.5">
                <span className="font-display text-5xl font-semibold tracking-tight text-white">
                  {t.price}
                </span>
                <span className="text-sm text-zinc-500">{t.period}</span>
              </div>
              <Link
                href={t.href}
                className={cn(
                  "mt-7 h-11 w-full text-sm",
                  t.highlight ? btnPrimary : btnGhost,
                )}
              >
                {t.cta}
              </Link>
              <ul className="mt-8 space-y-3 border-t border-white/[0.07] pt-7 text-sm">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-zinc-400">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            </Reveal>
          ))}
        </div>
        <p className="mt-8 text-sm text-zinc-600">
          Prices in EUR, VAT where applicable.
        </p>
      </Container>
    </section>
  );
}

/* ------------------------------------ FAQ ----------------------------------- */

function Faq() {
  const faqs = [
    {
      q: "Where does the lead data come from?",
      a: "Live from the Google Places API — anywhere in the world. Finnish leads are additionally cross-checked against the official YTJ / PRH business registry. Nothing is scraped.",
    },
    {
      q: "How does Sitovai know a business has no website?",
      a: "Google Places reports whether a business has a website listed. Sitovai flags the ones without one — and for Finnish companies also verifies they're active in the YTJ registry.",
    },
    {
      q: "Do I own the websites I generate?",
      a: "Yes. Every generated site can be exported as standard HTML/CSS files that you can host anywhere and sell to your client — no lock-in, no Sitovai branding.",
    },
    {
      q: "What language are the generated sites in?",
      a: "Sites are written in the business's own language, detected automatically from its location — with 10 languages to pick from (English, Finnish, Swedish, German, Spanish, Mandarin and more). Every text is editable.",
    },
    {
      q: "Can I cancel anytime?",
      a: "Yes. You can cancel from the billing page in one click; your plan stays active until the end of the current billing period.",
    },
    {
      q: "What happens when I hit my monthly limit?",
      a: "Searches and site generations pause until your next billing cycle, or you can upgrade to Pro instantly from the dashboard. Your existing leads and sites always stay accessible.",
    },
  ];
  return (
    <section id="faq" className="scroll-mt-20 border-b border-white/[0.07] py-24">
      <Container>
        <div className="grid gap-x-20 gap-y-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Eyebrow>FAQ</Eyebrow>
            <h2 className="font-display mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Questions, answered
            </h2>
            <p className="mt-4 max-w-xs text-[15px] leading-7 text-zinc-500">
              Anything else? Reach us any time from the dashboard once you&apos;re
              in.
            </p>
          </div>
          <div>
            {faqs.map((f) => (
              <details
                key={f.q}
                className="faq group border-b border-white/[0.08] first:border-t"
              >
                <summary className="flex items-center justify-between gap-4 py-5 text-[15px] font-medium text-zinc-200 transition hover:text-white">
                  {f.q}
                  <Plus className="faq-icon h-4 w-4 shrink-0 text-zinc-600" />
                </summary>
                <p className="pb-6 pr-8 text-[15px] leading-7 text-zinc-500">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

/* --------------------------------- CTA band --------------------------------- */

function CtaBand() {
  return (
    <section className="py-24">
      <Container>
        <Reveal>
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.09] px-8 py-20 text-center">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-[-45%] h-[400px] w-[760px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(99,102,241,0.28),transparent)] blur-3xl" />
            <div className="absolute inset-0 bg-grid-dark bg-grid-fade opacity-40" />
          </div>
          <div className="relative">
            <h2 className="font-display mx-auto max-w-2xl text-balance text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              Start finding no-website leads today
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-zinc-400">
              Spin up your workspace in under a minute. Your first week is on us.
            </p>
            <Link
              href="/signup"
              className={cn(btnPrimary, "mt-9 h-12 px-8 text-[15px]")}
            >
              Get started <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="mt-4 text-sm text-zinc-500">
              From €20/month · Cancel anytime
            </p>
          </div>
        </div>
        </Reveal>
      </Container>
    </section>
  );
}

/* ---------------------------------- footer ---------------------------------- */

function SiteFooter() {
  return (
    <footer className="border-t border-white/[0.07] pb-10 pt-16">
      <Container>
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-6 text-zinc-500">
              Find local businesses without a website and build them one with
              AI — in their own language, from first search to shipped site.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
              Product
            </p>
            <ul className="mt-4 space-y-3 text-sm text-zinc-500">
              {[
                ["#features", "Features"],
                ["#how", "How it works"],
                ["#pricing", "Pricing"],
                ["#faq", "FAQ"],
              ].map(([href, label]) => (
                <li key={href}>
                  <a href={href} className="transition hover:text-white">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
              Get started
            </p>
            <ul className="mt-4 space-y-3 text-sm text-zinc-500">
              <li>
                <Link href="/signup" className="transition hover:text-white">
                  Create account
                </Link>
              </li>
              <li>
                <Link href="/login" className="transition hover:text-white">
                  Sign in
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/[0.07] pt-6 text-sm text-zinc-500 sm:flex-row">
          <p>© {new Date().getFullYear()} Sitovai. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="transition hover:text-white">
              Privacy
            </Link>
            <Link href="/terms" className="transition hover:text-white">
              Terms
            </Link>
            <span className="font-mono text-xs">sitovai.com</span>
          </div>
        </div>
      </Container>
    </footer>
  );
}
