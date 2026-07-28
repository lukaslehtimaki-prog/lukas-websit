"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { BrandMark, Wordmark } from "@/components/ui/brand";

/**
 * Mobile navigation for the dashboard — the desktop sidebar is hidden under
 * md and previously had no replacement at all.
 *
 * Split in two pieces on purpose: the hamburger lives inside the sticky
 * header, but the header's backdrop-blur creates a CSS containing block that
 * would trap a `fixed` overlay inside its 64px strip. So the button only
 * dispatches an event, and the overlay itself is mounted at the layout root
 * (next to the command palette) where `fixed inset-0` really means the
 * viewport.
 */
const DRAWER_OPEN_EVENT = "sitovai:mobilenav";

export function MobileNavButton() {
  return (
    <button
      type="button"
      aria-label="Open menu"
      onClick={() => window.dispatchEvent(new Event(DRAWER_OPEN_EVENT))}
      className="grid h-9 w-9 select-none place-items-center rounded-lg text-zinc-600 transition-all duration-150 hover:bg-zinc-100 active:scale-95 md:hidden dark:text-zinc-300 dark:hover:bg-zinc-800"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}

export function MobileDrawer({ isPlatformAdmin }: { isPlatformAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener(DRAWER_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(DRAWER_OPEN_EVENT, onOpen);
  }, []);

  // Close when navigation happens (link tapped) and on Escape.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- closing on route change is the intent
    setOpen(false);
  }, [pathname]);
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] bg-zinc-950/40 backdrop-blur-[2px] md:hidden"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="drawer-in flex h-full w-72 max-w-[85vw] flex-col overflow-y-auto border-r border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-100 px-5 dark:border-zinc-800">
          <span className="flex items-center gap-2.5 text-[15px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            <BrandMark size={28} />
            <Wordmark />
          </span>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="grid h-9 w-9 place-items-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <Sidebar isPlatformAdmin={isPlatformAdmin} />
      </div>
    </div>
  );
}
