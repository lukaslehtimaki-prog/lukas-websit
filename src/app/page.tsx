import Link from "next/link";
import {
  Search,
  ShieldCheck,
  Globe,
  Users,
  Check,
  ArrowRight,
  Sparkles,
  MapPin,
  FileSpreadsheet,
  Zap,
  Plus,
  MousePointerClick,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[#06060a] text-zinc-100 selection:bg-indigo-500/30">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <LogosStrip />
        <StatsBand />
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
        "flex items-center gap-2.5 font-semibold tracking-tight text-white",
        className,
      )}
    >
      <span className="relative grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-400 text-[15px] font-bold text-white shadow-[0_0_20px_-4px_rgba(99,102,241,0.8)]">
        S
      </span>
      <span className="text-[17px]">Sitovai</span>
    </Link>
  );
}

const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 font-medium text-white shadow-[0_8px_30px_-8px_rgba(99,102,241,0.7)] transition-all duration-200 hover:shadow-[0_8px_40px_-6px_rgba(99,102,241,0.9)] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60";
const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 font-medium text-zinc-200 backdrop-blur transition-all duration-200 hover:border-white/20 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60";

function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1 text-xs font-medium uppercase tracking-widest text-indigo-300">
        {eyebrow}
      </p>
      <h2 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-4 text-lg leading-8 text-zinc-400">{subtitle}</p>
      ) : null}
    </div>
  );
}

/* ---------------------------------- header ---------------------------------- */

function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <Container className="pt-4">
        <div className="glass-strong flex h-14 items-center justify-between rounded-2xl px-4 pl-5">
          <Logo />
          <nav className="hidden items-center gap-7 text-sm text-zinc-400 md:flex">
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
              className="hidden h-9 items-center rounded-xl px-3.5 text-sm font-medium text-zinc-300 transition hover:text-white sm:inline-flex"
            >
              Sign in
            </Link>
            <Link href="/signup" className={cn(btnPrimary, "h-9 px-4 text-sm")}>
              Get started
            </Link>
          </div>
        </div>
      </Container>
    </header>
  );
}

/* ----------------------------------- hero ----------------------------------- */

function Hero() {
  return (
    <section className="relative overflow-hidden pt-14">
      {/* backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-grid-dark bg-grid-fade" />
        <div className="animate-aurora absolute left-1/2 top-[-22%] h-[560px] w-[980px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(99,102,241,0.32),rgba(139,92,246,0.16),transparent)] blur-3xl" />
        <div className="absolute right-[-10%] top-[30%] h-[380px] w-[380px] rounded-full bg-[radial-gradient(closest-side,rgba(34,211,238,0.14),transparent)] blur-3xl" />
        <div className="absolute left-[-8%] top-[46%] h-[320px] w-[320px] rounded-full bg-[radial-gradient(closest-side,rgba(139,92,246,0.14),transparent)] blur-3xl" />
      </div>

      <Container className="pb-24 pt-24 text-center sm:pt-32">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[13px] text-zinc-300 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
            AI lead-gen for local businesses
            <span className="ml-1 hidden rounded-full bg-indigo-500/20 px-2 py-0.5 text-[11px] font-medium text-indigo-300 sm:inline">
              New
            </span>
          </span>
        </div>

        <h1
          className="animate-fade-up mx-auto mt-7 max-w-4xl text-balance text-[2.6rem] font-semibold leading-[1.05] tracking-tight sm:text-7xl"
          style={{ animationDelay: "60ms" }}
        >
          <span className="text-shimmer">Find businesses with no website.</span>
          <br />
          <span className="text-gradient">Build them one with AI.</span>
        </h1>

        <p
          className="animate-fade-up mx-auto mt-7 max-w-2xl text-lg leading-8 text-zinc-400"
          style={{ animationDelay: "120ms" }}
        >
          Sitovai scans Google Places worldwide, enriches every lead with
          registry data, and turns the best ones into ready-to-launch websites
          — written in the business&apos;s own language.
        </p>

        <div
          className="animate-fade-up mt-10 flex flex-wrap items-center justify-center gap-3"
          style={{ animationDelay: "180ms" }}
        >
          <Link href="/signup" className={cn(btnPrimary, "h-12 px-7 text-[15px]")}>
            Get started <ArrowRight className="h-4 w-4" />
          </Link>
          <a href="#how" className={cn(btnGhost, "h-12 px-7 text-[15px]")}>
            See how it works
          </a>
        </div>
        <p
          className="animate-fade-up mt-5 text-sm text-zinc-500"
          style={{ animationDelay: "220ms" }}
        >
          Plans from €20/mo · Cancel anytime
        </p>

        <div className="animate-fade-up mt-16" style={{ animationDelay: "280ms" }}>
          <HeroPreview />
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
      status: "No website",
    },
    {
      name: "Kahvila Siilinjärvi",
      area: "Kuopio",
      yt: "2988771-4",
      status: "No website",
    },
    {
      name: "Autohuolto Mäkinen",
      area: "Lahti",
      yt: "3120997-8",
      status: "No website",
    },
  ];
  return (
    <div className="relative mx-auto max-w-4xl">
      {/* halo behind the window */}
      <div className="pointer-events-none absolute -inset-x-8 -top-10 bottom-0 -z-10 rounded-[40px] bg-[radial-gradient(closest-side,rgba(99,102,241,0.22),transparent)] blur-2xl" />

      <div className="glow-ring overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b12] text-left">
        {/* window chrome */}
        <div className="flex items-center gap-2 border-b border-white/5 bg-white/[0.03] px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-white/15" />
          <span className="h-3 w-3 rounded-full bg-white/15" />
          <span className="h-3 w-3 rounded-full bg-white/15" />
          <span className="ml-3 rounded-md bg-white/5 px-3 py-1 text-xs text-zinc-500 ring-1 ring-white/10">
            sitovai.com / dashboard / leads
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

          <div className="overflow-hidden rounded-xl border border-white/5">
            <div className="grid grid-cols-[1.6fr_0.9fr_0.9fr_auto] gap-2 border-b border-white/5 bg-white/[0.03] px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
              <span>Business</span>
              <span>Website</span>
              <span>Registry</span>
              <span />
            </div>
            {rows.map((r) => (
              <div
                key={r.yt}
                className="grid grid-cols-[1.6fr_0.9fr_0.9fr_auto] items-center gap-2 px-4 py-3 text-sm [&:not(:last-child)]:border-b [&:not(:last-child)]:border-white/5"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium text-zinc-200">{r.name}</div>
                  <div className="text-xs text-zinc-500">{r.area}</div>
                </div>
                <span className="inline-flex w-fit items-center rounded-full border border-amber-400/20 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-300">
                  {r.status}
                </span>
                <span className="font-mono text-xs text-emerald-400">{r.yt}</span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 px-2.5 py-1 text-xs font-medium text-white shadow-[0_4px_14px_-4px_rgba(99,102,241,0.8)]">
                  <Sparkles className="h-3 w-3" /> Build site
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* floating accent cards */}
      <div className="animate-float absolute -right-4 -top-8 hidden rounded-xl border border-white/10 bg-[#0d0d16]/90 px-4 py-3 text-left shadow-2xl backdrop-blur lg:block">
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-300">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-emerald-500/15 text-emerald-300">
            <Check className="h-3.5 w-3.5" />
          </span>
          Site generated in 42 s
        </div>
        <p className="mt-1 pl-8 font-mono text-[11px] text-zinc-500">
          kahvila-siilinjarvi · preview ready
        </p>
      </div>
      <div
        className="animate-float absolute -left-6 bottom-10 hidden rounded-xl border border-white/10 bg-[#0d0d16]/90 px-4 py-3 text-left shadow-2xl backdrop-blur lg:block"
        style={{ animationDelay: "1.4s" }}
      >
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-300">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-indigo-500/15 text-indigo-300">
            <ShieldCheck className="h-3.5 w-3.5" />
          </span>
          Registry verified · 3312445-1
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
    <section className="border-y border-white/5 bg-white/[0.015] py-9">
      <Container>
        <p className="mb-6 text-center text-xs font-medium uppercase tracking-widest text-zinc-500">
          Powered by
        </p>
        <div
          className="overflow-hidden"
          style={{
            maskImage:
              "linear-gradient(to right, transparent, #000 12%, #000 88%, transparent)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent, #000 12%, #000 88%, transparent)",
          }}
        >
          <div className="animate-marquee flex w-max items-center gap-14 pr-14">
            {row.map((i, idx) => (
              <span
                key={`${i}-${idx}`}
                className="whitespace-nowrap text-sm font-medium text-zinc-500"
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

/* -------------------------------- stats band -------------------------------- */

function StatsBand() {
  const stats = [
    { value: "~40", label: "businesses surfaced per search" },
    { value: "< 60 s", label: "from lead to a full draft website" },
    { value: "10", label: "languages for generated websites" },
    { value: "1 click", label: "CSV export of every lead list" },
  ];
  return (
    <section className="py-16">
      <Container>
        <div className="grid gap-8 rounded-2xl border border-white/5 bg-white/[0.02] px-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-gradient text-4xl font-semibold tracking-tight">
                {s.value}
              </div>
              <p className="mt-2 text-sm leading-6 text-zinc-500">{s.label}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* --------------------------------- features --------------------------------- */

function Features() {
  return (
    <section id="features" className="scroll-mt-24 py-24">
      <Container>
        <SectionHeading
          eyebrow="Everything in one place"
          title="From cold search to shipped website"
          subtitle="The full workflow a freelancer or agency needs to find local businesses and win them as clients."
        />

        <div className="mt-14 grid gap-5 lg:grid-cols-6">
          {/* Lead finder — large */}
          <BentoCard className="lg:col-span-3">
            <FeatureIcon>
              <Search className="h-5 w-5" />
            </FeatureIcon>
            <h3 className="text-lg font-semibold tracking-tight text-white">
              Chat-style lead finder
            </h3>
            <p className="mt-2 text-[15px] leading-7 text-zinc-400">
              Describe a niche and a location. Sitovai queries Google Places and
              returns a clean list with website status detected instantly.
            </p>
            <div className="mt-6 rounded-xl border border-white/5 bg-black/30 p-3">
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-400">
                <Search className="h-4 w-4 text-indigo-400" />
                kampaamot Tampereella ilman nettisivuja…
                <span className="ml-auto rounded-md bg-gradient-to-r from-indigo-500 to-violet-500 px-2 py-0.5 text-xs font-medium text-white">
                  Search
                </span>
              </div>
              <div className="mt-2 flex gap-2">
                {["Barbershop", "Tampere", "5 km", "No website"].map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-zinc-400"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </BentoCard>

          {/* AI builder — large */}
          <BentoCard className="lg:col-span-3">
            <FeatureIcon>
              <Globe className="h-5 w-5" />
            </FeatureIcon>
            <h3 className="text-lg font-semibold tracking-tight text-white">
              AI website builder
            </h3>
            <p className="mt-2 text-[15px] leading-7 text-zinc-400">
              Turn a lead into a mobile-ready site in seconds — in the
              business&apos;s own language. Preview live, edit inline, export.
            </p>
            <div className="mt-6 grid grid-cols-3 gap-2">
              {["Moderni", "Klassinen", "Rohkea"].map((t, i) => (
                <div
                  key={t}
                  className={cn(
                    "rounded-lg border p-2.5 text-center",
                    i === 0
                      ? "border-indigo-400/40 bg-indigo-500/10"
                      : "border-white/5 bg-black/30",
                  )}
                >
                  <div
                    className={cn(
                      "mx-auto mb-2 h-8 w-full rounded",
                      i === 0
                        ? "bg-gradient-to-br from-indigo-500/60 to-violet-500/40"
                        : "bg-white/10",
                    )}
                  />
                  <span
                    className={cn(
                      "text-[11px] font-medium",
                      i === 0 ? "text-indigo-300" : "text-zinc-500",
                    )}
                  >
                    {t}
                  </span>
                </div>
              ))}
            </div>
          </BentoCard>

          {/* three small */}
          <BentoCard className="lg:col-span-2">
            <FeatureIcon>
              <ShieldCheck className="h-5 w-5" />
            </FeatureIcon>
            <h3 className="text-lg font-semibold tracking-tight text-white">
              Registry cross-check
            </h3>
            <p className="mt-2 text-[15px] leading-7 text-zinc-400">
              Finnish leads are matched to the official YTJ registry —
              business ID, industry code, registration date.
            </p>
          </BentoCard>

          <BentoCard className="lg:col-span-2">
            <FeatureIcon>
              <Users className="h-5 w-5" />
            </FeatureIcon>
            <h3 className="text-lg font-semibold tracking-tight text-white">
              Built-in CRM
            </h3>
            <p className="mt-2 text-[15px] leading-7 text-zinc-400">
              Track lead status from &ldquo;new&rdquo; to &ldquo;won&rdquo;,
              invite your team, and keep every workspace isolated.
            </p>
          </BentoCard>

          <BentoCard className="lg:col-span-2">
            <FeatureIcon>
              <FileSpreadsheet className="h-5 w-5" />
            </FeatureIcon>
            <h3 className="text-lg font-semibold tracking-tight text-white">
              One-click export
            </h3>
            <p className="mt-2 text-[15px] leading-7 text-zinc-400">
              Download any lead list as CSV for your outreach tool, or export a
              finished site as ready-to-host files.
            </p>
          </BentoCard>
        </div>
      </Container>
    </section>
  );
}

function BentoCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("card-dark card-dark-hover rounded-2xl p-7", className)}>
      {children}
    </div>
  );
}

function FeatureIcon({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl border border-indigo-400/20 bg-indigo-500/10 text-indigo-300">
      {children}
    </div>
  );
}

/* -------------------------------- how it works ------------------------------ */

function HowItWorks() {
  const steps = [
    {
      icon: <MousePointerClick className="h-5 w-5" />,
      title: "Describe your target",
      body: "Type a niche and a town, set a radius. Sitovai queries Google Places behind the scenes.",
    },
    {
      icon: <Zap className="h-5 w-5" />,
      title: "Get qualified leads",
      body: "See who has no website, enriched with registry data where available. Filter, tag, and export.",
    },
    {
      icon: <Globe className="h-5 w-5" />,
      title: "Ship their website",
      body: "Generate a polished site in the local language from real business data. Preview, tweak, hand it over.",
    },
  ];
  return (
    <section id="how" className="relative overflow-hidden scroll-mt-24 border-y border-white/5 bg-white/[0.015] py-24">
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[300px] w-[700px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(99,102,241,0.1),transparent)] blur-3xl" />
      <Container>
        <SectionHeading eyebrow="How it works" title="Three steps to a new client" />
        <div className="relative mt-16 grid gap-10 md:grid-cols-3">
          {/* connecting line */}
          <div className="pointer-events-none absolute left-[16.66%] right-[16.66%] top-6 hidden h-px bg-gradient-to-r from-indigo-500/50 via-violet-500/50 to-cyan-400/50 md:block" />
          {steps.map((s, i) => (
            <div key={s.title} className="relative text-center md:text-left">
              <div className="relative z-10 mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-indigo-400/30 bg-[#0b0b14] text-indigo-300 shadow-[0_0_30px_-6px_rgba(99,102,241,0.5)] md:mx-0">
                {s.icon}
              </div>
              <div className="mt-5 text-xs font-semibold uppercase tracking-widest text-indigo-400">
                Step {i + 1}
              </div>
              <h3 className="mt-1.5 text-xl font-semibold tracking-tight text-white">
                {s.title}
              </h3>
              <p className="mt-2 text-[15px] leading-7 text-zinc-400">{s.body}</p>
            </div>
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
    <section id="pricing" className="scroll-mt-24 py-24">
      <Container>
        <SectionHeading
          eyebrow="Pricing"
          title="Simple, transparent plans"
          subtitle="Pick a plan and start today from €20/month. Cancel whenever you like."
        />
        <div className="mx-auto mt-14 grid max-w-3xl gap-6 sm:grid-cols-2">
          {TIERS.map((t) => (
            <div
              key={t.name}
              className={cn(
                "relative flex flex-col rounded-2xl p-7",
                t.highlight
                  ? "border border-indigo-400/40 bg-gradient-to-b from-indigo-500/[0.14] to-violet-500/[0.05] shadow-[0_0_60px_-12px_rgba(99,102,241,0.45)]"
                  : "card-dark",
              )}
            >
              {"badge" in t && t.badge ? (
                <span className="absolute -top-3 left-7 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-3 py-1 text-xs font-medium text-white shadow-[0_4px_20px_-4px_rgba(99,102,241,0.8)]">
                  {t.badge}
                </span>
              ) : null}
              <h3 className="text-lg font-semibold text-white">{t.name}</h3>
              <p className="mt-1 text-sm text-zinc-500">{t.desc}</p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tight text-white">
                  {t.price}
                </span>
                <span className="text-sm text-zinc-500">{t.period}</span>
              </div>
              <Link
                href={t.href}
                className={cn(
                  "mt-6 h-10 w-full text-sm",
                  t.highlight ? btnPrimary : btnGhost,
                )}
              >
                {t.cta}
              </Link>
              <ul className="mt-7 space-y-3 text-sm">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-zinc-400">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-zinc-500">
          Prices in EUR, VAT where applicable. Payments handled securely by Stripe.
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
    <section id="faq" className="scroll-mt-24 border-t border-white/5 py-24">
      <Container className="max-w-3xl">
        <SectionHeading eyebrow="FAQ" title="Questions, answered" />
        <div className="mt-12 space-y-3">
          {faqs.map((f) => (
            <details
              key={f.q}
              className="faq group rounded-xl border border-white/10 bg-white/[0.03] px-5 transition hover:border-white/20"
            >
              <summary className="flex items-center justify-between gap-4 py-4 text-[15px] font-medium text-zinc-200">
                {f.q}
                <Plus className="faq-icon h-4 w-4 shrink-0 text-zinc-500" />
              </summary>
              <p className="pb-5 text-[15px] leading-7 text-zinc-400">{f.a}</p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* --------------------------------- CTA band --------------------------------- */

function CtaBand() {
  return (
    <section className="pb-28">
      <Container>
        <div className="bg-noise relative overflow-hidden rounded-3xl border border-white/10 px-8 py-20 text-center">
          <div className="pointer-events-none absolute inset-0 -z-0">
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/[0.16] via-violet-500/[0.08] to-transparent" />
            <div className="absolute left-1/2 top-[-40%] h-[380px] w-[700px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(99,102,241,0.35),transparent)] blur-3xl" />
            <div className="absolute inset-0 bg-grid-dark bg-grid-fade opacity-60" />
          </div>
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-balance text-3xl font-semibold tracking-tight text-white sm:text-5xl">
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
      </Container>
    </section>
  );
}

/* ---------------------------------- footer ---------------------------------- */

function SiteFooter() {
  return (
    <footer className="border-t border-white/5 pb-10 pt-16">
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
            <p className="text-sm font-semibold text-zinc-300">Product</p>
            <ul className="mt-4 space-y-3 text-sm text-zinc-500">
              <li>
                <a href="#features" className="transition hover:text-white">
                  Features
                </a>
              </li>
              <li>
                <a href="#how" className="transition hover:text-white">
                  How it works
                </a>
              </li>
              <li>
                <a href="#pricing" className="transition hover:text-white">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#faq" className="transition hover:text-white">
                  FAQ
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-300">Get started</p>
            <ul className="mt-4 space-y-3 text-sm text-zinc-500">
              <li>
                <Link href="/signup" className="transition hover:text-white">
                  Get started
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
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/5 pt-6 text-sm text-zinc-500 sm:flex-row">
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
