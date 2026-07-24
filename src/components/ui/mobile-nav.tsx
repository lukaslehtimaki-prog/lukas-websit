"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Container } from "@/components/ui/container";

const LINKS: [string, string][] = [
  ["#features", "Features"],
  ["#how", "How it works"],
  ["#pricing", "Pricing"],
  ["#faq", "FAQ"],
];

/**
 * Mobile-only header menu for the marketing site. On phones the desktop nav and
 * the "Sign in" link are hidden, so this is the only way to reach the sections
 * and the login page.
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  // Closing synchronously unmounts the link and can cancel the browser's own
  // anchor jump, so let the native navigation run first and close on the next
  // tick. Native behaviour also updates the URL hash (shareable, back-button).
  function closeAfterNavigation() {
    setTimeout(close, 0);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-[10px] border border-white/15 bg-white/[0.04] text-zinc-300 transition hover:border-white/25 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 md:hidden"
      >
        {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      {open ? (
        <div className="absolute inset-x-0 top-full border-b border-white/[0.07] bg-[#08090f] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.9)] md:hidden">
          <Container className="flex flex-col py-2">
            {LINKS.map(([href, label]) => (
              <a
                key={href}
                href={href}
                onClick={closeAfterNavigation}
                className="border-b border-white/[0.06] py-3.5 text-[15px] text-zinc-300 transition hover:text-white"
              >
                {label}
              </a>
            ))}
            <Link
              href="/login"
              onClick={close}
              className="py-4 text-[15px] font-medium text-zinc-100 transition hover:text-white"
            >
              Sign in
            </Link>
          </Container>
        </div>
      ) : null}
    </>
  );
}
