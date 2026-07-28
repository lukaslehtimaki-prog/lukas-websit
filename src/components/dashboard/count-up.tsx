"use client";

import { useEffect, useState } from "react";

/**
 * Animates a stat from 0 to its value on mount (~700ms, ease-out). Renders the
 * final value immediately for reduced-motion users and during SSR so there is
 * never a wrong number in the HTML. No run-once guard: the effect fully
 * restarts if React remounts it (StrictMode double-invokes effects in dev —
 * a guard ref survives the remount and left the display stuck at 0).
 */
export function CountUp({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (value === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const duration = 700;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(value * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    // eslint-disable-next-line react-hooks/set-state-in-effect -- seeds the animation start frame
    setDisplay(0);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <>{display.toLocaleString()}</>;
}
