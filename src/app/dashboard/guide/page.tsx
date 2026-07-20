import type { ReactNode } from "react";
import Link from "next/link";
import {
  Search,
  Sparkles,
  Wand2,
  Globe,
  Mail,
  CreditCard,
  Link2,
  ArrowRight,
} from "lucide-react";

export const metadata = { title: "How to sell · Sitovai" };

type Step = {
  icon: ReactNode;
  title: string;
  body: string;
  bullets?: string[];
  href?: { label: string; to: string };
};

const STEPS: Step[] = [
  {
    icon: <Search className="h-5 w-5" />,
    title: "Find a business with no website",
    body: "Open the Lead Finder, choose a location, and either tick a few niches in the quick-pick (barbershops, plumbers, salons…) or use “Every business type” to sweep a whole town. The finder checks each business for a real website and only keeps the ones that need one.",
    bullets: [
      "“Only without a real website” is on by default — you only get opportunities.",
      "Social-only and dead-site businesses are great leads: they clearly want to be online.",
    ],
    href: { label: "Open Lead Finder", to: "/dashboard/leads" },
  },
  {
    icon: <Sparkles className="h-5 w-5" />,
    title: "Build their website in one click",
    body: "Pick a lead and hit build. Sitovai writes a complete website in the business’s own language, pulls in their real Google photos and reviews, and picks a design that fits their trade — in about 20 seconds.",
    href: { label: "Your websites", to: "/dashboard/sites" },
  },
  {
    icon: <Wand2 className="h-5 w-5" />,
    title: "Make it perfect — just talk to the AI",
    body: "In the editor, use “Edit with AI”: type what you want and it changes the site for you — no regenerating. Set prices, add the team, change the brand colour, hide or reorder sections. You can also edit anything by hand.",
    bullets: [
      "e.g. “set the haircut to 35 €”, “add a 10% off offer”, “make the brand green”.",
    ],
  },
  {
    icon: <Globe className="h-5 w-5" />,
    title: "Publish it",
    body: "Hit Publish and the site gets a live link you can share instantly (sitovai.com/s/…). No hosting setup, nothing to configure.",
  },
  {
    icon: <Mail className="h-5 w-5" />,
    title: "Pitch it to the business",
    body: "Use “Pitch it to the business”. The AI writes a friendly sales email in their language, with the live preview and a one-click Buy button. Send it from the app or your own mail — replies come straight to you.",
    bullets: [
      "Set your price (default 500 €) — Sitovai creates the Stripe pay link automatically.",
    ],
  },
  {
    icon: <CreditCard className="h-5 w-5" />,
    title: "Get paid — and it goes live",
    body: "The owner clicks Buy, pays by card, and the site is marked Sold. To receive money, connect your Stripe once in Settings → Website sale payouts. That’s it — you’ve sold a website.",
    href: { label: "Set up payouts", to: "/dashboard/settings" },
  },
  {
    icon: <Link2 className="h-5 w-5" />,
    title: "Put it on their own domain (optional)",
    body: "Want it on their own address like theirbusiness.com? You’ll be able to paste the domain on the site and follow the DNS steps to point it at Sitovai. (Coming shortly — for now the shareable link works everywhere.)",
  },
];

export default function GuidePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          How to sell a website
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
          The whole flow, start to finish. Follow it once and you’ll have sold
          your first site — it’s simpler than it looks.
        </p>
      </div>

      <ol className="space-y-4">
        {STEPS.map((s, i) => (
          <li
            key={i}
            className="relative flex gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex flex-col items-center">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white">
                {s.icon}
              </span>
              {i < STEPS.length - 1 ? (
                <span className="mt-2 w-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1 pb-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-indigo-500">
                  Step {i + 1}
                </span>
              </div>
              <h2 className="mt-0.5 font-semibold text-zinc-900 dark:text-zinc-100">
                {s.title}
              </h2>
              <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                {s.body}
              </p>
              {s.bullets ? (
                <ul className="mt-2 space-y-1">
                  {s.bullets.map((b, j) => (
                    <li
                      key={j}
                      className="flex items-start gap-2 text-sm text-zinc-500 dark:text-zinc-400"
                    >
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-indigo-400" />
                      {b}
                    </li>
                  ))}
                </ul>
              ) : null}
              {s.href ? (
                <Link
                  href={s.href.to}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  {s.href.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : null}
            </div>
          </li>
        ))}
      </ol>

      <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 text-sm text-indigo-900 dark:border-indigo-500/25 dark:bg-indigo-500/10 dark:text-indigo-200">
        <p className="font-semibold">The one-line pitch to a business owner</p>
        <p className="mt-1 leading-6">
          “I already built your business a website — here’s the link. If you like
          it, it’s yours for a one-time price. Nothing to set up on your end.”
          Show, don’t sell.
        </p>
      </div>
    </div>
  );
}
