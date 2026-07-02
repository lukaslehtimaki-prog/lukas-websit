import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#06060a] px-4 py-12">
      {/* backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-grid-dark bg-grid-fade opacity-70" />
        <div className="animate-aurora absolute left-1/2 top-[-25%] h-[480px] w-[820px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(99,102,241,0.3),rgba(139,92,246,0.14),transparent)] blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-10%] h-[340px] w-[340px] rounded-full bg-[radial-gradient(closest-side,rgba(34,211,238,0.12),transparent)] blur-3xl" />
      </div>

      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2.5 text-lg font-semibold tracking-tight text-white"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-400 text-[16px] font-bold text-white shadow-[0_0_24px_-4px_rgba(99,102,241,0.8)]">
            S
          </span>
          Sitexa
        </Link>
        <div className="rounded-2xl border border-white/10 bg-white p-8 shadow-[0_0_0_1px_rgba(165,180,252,0.15),0_0_80px_-16px_rgba(99,102,241,0.45),0_40px_100px_-32px_rgba(0,0,0,0.9)]">
          {children}
        </div>
        <p className="mt-6 text-center text-xs text-zinc-500">
          7-day free trial · Cancel anytime
        </p>
      </div>
    </div>
  );
}
