"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  Globe,
  Inbox,
  BarChart3,
  CreditCard,
  BookOpen,
  Settings,
  Loader2,
  CornerDownLeft,
  Store,
} from "lucide-react";
import {
  paletteSearchAction,
  type PaletteResults,
} from "@/app/dashboard/palette/actions";
import { cn } from "@/lib/utils";

/** Fired by the header hint button; the palette also opens on ⌘K / Ctrl+K. */
export const PALETTE_OPEN_EVENT = "sitagio:palette";

type Item = {
  key: string;
  label: string;
  hint?: string;
  icon: React.ReactNode;
  href: string;
  section: "Pages" | "Websites" | "Leads";
};

const PAGES: Omit<Item, "key" | "section">[] = [
  { label: "Overview", icon: <LayoutDashboard className="h-4 w-4" />, href: "/dashboard" },
  { label: "Lead Finder", icon: <Search className="h-4 w-4" />, href: "/dashboard/leads" },
  { label: "Websites", icon: <Globe className="h-4 w-4" />, href: "/dashboard/sites" },
  { label: "Messages", icon: <Inbox className="h-4 w-4" />, href: "/dashboard/messages" },
  { label: "Usage", icon: <BarChart3 className="h-4 w-4" />, href: "/dashboard/usage" },
  { label: "Billing", icon: <CreditCard className="h-4 w-4" />, href: "/dashboard/billing" },
  { label: "How to sell", icon: <BookOpen className="h-4 w-4" />, href: "/dashboard/guide" },
  { label: "Settings", icon: <Settings className="h-4 w-4" />, href: "/dashboard/settings" },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PaletteResults>({ sites: [], leads: [] });
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const requestSeq = useRef(0);

  // Open/close listeners.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    function onOpenEvent() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener(PALETTE_OPEN_EVENT, onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(PALETTE_OPEN_EVENT, onOpenEvent);
    };
  }, []);

  // Reset when opened; focus input.
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting stale state on open is the intent
      setQuery("");
      setResults({ sites: [], leads: [] });
      setSelected(0);
      // After the dialog paints.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Debounced server search for sites + leads.
  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing results below the min query length
      setResults({ sites: [], leads: [] });
      setSearching(false);
      return;
    }
     
    setSearching(true);
    const seq = ++requestSeq.current;
    const t = setTimeout(async () => {
      try {
        const r = await paletteSearchAction(q);
        if (requestSeq.current === seq) setResults(r);
      } finally {
        if (requestSeq.current === seq) setSearching(false);
      }
    }, 180);
    return () => clearTimeout(t);
  }, [query, open]);

  const items: Item[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pages = PAGES.filter(
      (p) => !q || p.label.toLowerCase().includes(q),
    ).map((p) => ({ ...p, key: `page:${p.href}`, section: "Pages" as const }));
    const sites = results.sites.map((s) => ({
      key: `site:${s.id}`,
      label: s.title,
      hint: s.status,
      icon: <Globe className="h-4 w-4" />,
      href: `/dashboard/sites/${s.id}`,
      section: "Websites" as const,
    }));
    const leads = results.leads.map((l) => ({
      key: `lead:${l.id}`,
      label: l.name,
      hint: l.category ?? undefined,
      icon: <Store className="h-4 w-4" />,
      href: `/dashboard/leads?q=${encodeURIComponent(l.name)}`,
      section: "Leads" as const,
    }));
    return [...pages, ...sites, ...leads];
  }, [query, results]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- keep the highlight on the first row as results change
    setSelected(0);
  }, [items.length, query]);

  const go = useCallback(
    (item: Item | undefined) => {
      if (!item) return;
      setOpen(false);
      router.push(item.href);
    },
    [router],
  );

  function onInputKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(items[selected]);
    }
  }

  if (!open) return null;

  let lastSection: string | null = null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center bg-zinc-950/40 px-4 pt-[12vh] backdrop-blur-[2px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div
        role="dialog"
        aria-label="Command palette"
        className="toast-in w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900"
      >
        <div className="flex items-center gap-2.5 border-b border-zinc-100 px-4 dark:border-zinc-800">
          {searching ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-zinc-400" />
          ) : (
            <Search className="h-4 w-4 shrink-0 text-zinc-400" />
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKey}
            placeholder="Search pages, websites, leads…"
            className="h-12 w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100"
          />
          <kbd className="hidden shrink-0 rounded border border-zinc-200 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400 sm:block dark:border-zinc-700">
            esc
          </kbd>
        </div>
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {items.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-zinc-400">
              {query.trim().length >= 2 && !searching
                ? "No matches."
                : "Type to search your websites and leads."}
            </p>
          ) : (
            items.map((item, i) => {
              const header =
                item.section !== lastSection ? item.section : null;
              lastSection = item.section;
              return (
                <div key={item.key}>
                  {header ? (
                    <p className="px-3 pb-1 pt-2.5 text-[11px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                      {header}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => go(item)}
                    onMouseEnter={() => setSelected(i)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors duration-75",
                      i === selected
                        ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
                        : "text-zinc-700 dark:text-zinc-300",
                    )}
                  >
                    <span
                      className={cn(
                        "shrink-0",
                        i === selected
                          ? "text-indigo-500"
                          : "text-zinc-400 dark:text-zinc-500",
                      )}
                    >
                      {item.icon}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    {item.hint ? (
                      <span className="shrink-0 text-xs capitalize text-zinc-400">
                        {item.hint}
                      </span>
                    ) : null}
                    {i === selected ? (
                      <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                    ) : null}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

/** Small header button advertising the palette (and opening it on tap/click). */
export function PaletteHint() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(PALETTE_OPEN_EVENT))}
      className="hidden select-none items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-400 shadow-sm transition-all duration-150 hover:border-zinc-300 hover:text-zinc-600 active:scale-[0.97] sm:flex dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-500 dark:hover:border-zinc-600 dark:hover:text-zinc-300"
    >
      <Search className="h-3.5 w-3.5" />
      Search
      <kbd className="rounded border border-zinc-200 px-1.5 py-0.5 text-[10px] font-medium dark:border-zinc-700">
        ⌘K
      </kbd>
    </button>
  );
}
