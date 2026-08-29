"use client";

import { useEffect, useRef } from "react";

/**
 * 2px reading-progress bar pinned to the bottom edge of the sticky header.
 *
 * Written straight to the element's transform inside a rAF-throttled passive
 * scroll listener — no React state, so a fast scroll never queues a render per
 * frame. Purely decorative, so it is aria-hidden and disappears in print.
 */
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = ref.current;
      if (!el) return;
      const max =
        document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      el.style.transform = `scaleX(${ratio})`;
    };
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 overflow-hidden print:hidden"
    >
      <div
        ref={ref}
        className="h-full origin-left bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}
