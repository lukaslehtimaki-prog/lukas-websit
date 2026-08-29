"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { useLanding } from "@/lib/landing-i18n";

/**
 * Marketing-only "back to top" control.
 *
 * The landing runs seven full-height sections, so a phone reader arriving at
 * the footer is several screens from the nav. Appears past ~600px, bottom
 * right. The landing has no other floating element (the mobile CTA lives in
 * the sticky header), so nothing collides with it.
 *
 * Scroll is read through requestAnimationFrame with a passive listener, and
 * the scroll itself falls back to an instant jump when the visitor has asked
 * for reduced motion.
 */
export function BackToTop() {
  const { t } = useLanding();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        setVisible(window.scrollY > 600);
      });
    };
    // Read once on mount (through the same rAF path, which lands on the very
    // next frame) so a page restored mid-scroll shows the control immediately.
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const toTop = () => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  };

  return (
    <button
      type="button"
      onClick={toTop}
      aria-label={t.footer.backToTop}
      title={t.footer.backToTop}
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      className={`fixed bottom-5 right-5 z-40 grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-[#0b0c12]/90 text-zinc-300 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.9)] backdrop-blur transition duration-200 hover:border-white/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 print:hidden ${
        visible
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none translate-y-2 opacity-0"
      }`}
    >
      <ArrowUp className="h-4 w-4" />
    </button>
  );
}
