import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { BrandMark, Wordmark } from "@/components/ui/brand";

export const metadata: Metadata = {
  title: "Page not found · Sitagio",
  description:
    "That Sitagio page does not exist. Head back to the homepage, the pricing section or your workspace to carry on.",
};

/**
 * Root 404. Also serves every unmatched URL on the domain, so it has to stand
 * on its own: the marketing shell's dark ground, the brand mark linking home,
 * and real routes to leave by. Written in English because the landing's
 * LangProvider is a client context that does not reach this segment.
 */
export default function NotFound() {
  const links: Array<[string, string]> = [
    ["/", "Homepage"],
    ["/#pricing", "Pricing"],
    ["/#faq", "FAQ"],
    ["/signup", "Create an account"],
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#05060a] text-zinc-100">
      <header className="border-b border-white/[0.07]">
        <Container className="flex h-16 items-center">
          <Link
            href="/"
            className="font-display flex items-center gap-2.5 text-[16px] font-semibold tracking-tight text-white"
          >
            <BrandMark size={30} className="shadow-[0_0_20px_-4px_rgba(99,102,241,0.8)]" />
            <Wordmark />
          </Link>
        </Container>
      </header>

      <main id="main" className="flex flex-1 items-center py-24">
        <Container>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-400">
            404
          </p>
          <h1 className="font-display mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            That page isn&apos;t here
          </h1>
          <p className="mt-5 max-w-lg text-[15px] leading-7 text-zinc-400">
            The link may be out of date, or the address mistyped. Sorry about
            that — here is where everything else lives.
          </p>

          <ul className="mt-10 grid max-w-lg gap-3 sm:grid-cols-2">
            {links.map(([href, label]) => (
              <li key={href}>
                <Link
                  href={href}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.09] bg-white/[0.02] px-4 py-3 text-[15px] text-zinc-300 transition hover:border-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
                >
                  {label}
                  <ArrowRight className="h-4 w-4 shrink-0 text-zinc-600" />
                </Link>
              </li>
            ))}
          </ul>

          <p className="mt-10 text-sm text-zinc-500">
            Still stuck? Email{" "}
            <a
              href="mailto:support@sitovaiagency.com"
              className="text-zinc-300 underline underline-offset-4 transition hover:text-white"
            >
              support@sitovaiagency.com
            </a>{" "}
            — we reply within 1 business day.
          </p>
        </Container>
      </main>

      <footer className="border-t border-white/[0.07] py-8">
        <Container className="flex flex-col items-center justify-between gap-3 text-sm text-zinc-500 sm:flex-row">
          <p>© {new Date().getFullYear()} Sitagio. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="transition hover:text-white">
              Privacy
            </Link>
            <Link href="/terms" className="transition hover:text-white">
              Terms
            </Link>
          </div>
        </Container>
      </footer>
    </div>
  );
}
