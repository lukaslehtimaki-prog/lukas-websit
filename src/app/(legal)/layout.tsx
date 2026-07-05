import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/container";

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#06060a] text-zinc-100">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#06060a]/80 backdrop-blur-md">
        <Container className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-semibold tracking-tight text-white"
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-400 text-[15px] font-bold text-white shadow-[0_0_20px_-4px_rgba(99,102,241,0.8)]">
              S
            </span>
            <span className="text-[17px]">Sitovai</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-zinc-300 transition hover:border-white/20 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Back to site
          </Link>
        </Container>
      </header>

      <main className="flex-1 py-16">
        <Container className="max-w-3xl">{children}</Container>
      </main>

      <footer className="border-t border-white/5 py-8">
        <Container className="flex flex-col items-center justify-between gap-3 text-sm text-zinc-500 sm:flex-row">
          <p>© {new Date().getFullYear()} Sitovai. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="transition hover:text-white">
              Privacy
            </Link>
            <Link href="/terms" className="transition hover:text-white">
              Terms
            </Link>
            <Link href="/" className="transition hover:text-white">
              Home
            </Link>
          </div>
        </Container>
      </footer>
    </div>
  );
}
