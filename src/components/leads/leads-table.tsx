"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  Trash2,
  ExternalLink,
  Download,
  Wand2,
  Search,
  SearchX,
  Inbox,
  ChevronDown,
} from "lucide-react";
import { updateLeadStatus, deleteLead } from "@/app/dashboard/leads/actions";
import { cn } from "@/lib/utils";

export type LeadRow = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  category: string | null;
  website: string | null;
  website_status: string;
  business_id: string | null;
  registry_status: string;
  registry_registration_date: string | null;
  registry_industry_code: string | null;
  crm_status: string;
  place_id: string | null;
  created_at: string;
};

const CRM_STATUSES = [
  "new",
  "contacted",
  "interested",
  "converted",
  "rejected",
];

const CRM_DOT: Record<string, string> = {
  new: "bg-sky-500",
  contacted: "bg-violet-500",
  interested: "bg-amber-500",
  converted: "bg-emerald-500",
  rejected: "bg-zinc-400",
};

function WebsiteBadge({ status, website }: { status: string; website: string | null }) {
  if (status === "no_website") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/25">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        No website
      </span>
    );
  }
  if (status === "social_only") {
    return (
      <a
        href={website ?? "#"}
        target="_blank"
        rel="noopener noreferrer"
        title="Only a social-media or directory profile — still a great lead"
        className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-800 ring-1 ring-inset ring-sky-200 transition hover:ring-sky-300 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/25"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
        Social only <ExternalLink className="h-3 w-3" />
      </a>
    );
  }
  if (status === "dead_site") {
    return (
      <a
        href={website ?? "#"}
        target="_blank"
        rel="noopener noreferrer"
        title="The listed website doesn't respond — likely dead or parked"
        className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-800 ring-1 ring-inset ring-red-200 transition hover:ring-red-300 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/25"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        Dead site <ExternalLink className="h-3 w-3" />
      </a>
    );
  }
  return (
    <a
      href={website ?? "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded-full bg-zinc-50 dark:bg-zinc-950 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:text-zinc-300 ring-1 ring-inset ring-zinc-200 dark:ring-zinc-700 transition hover:text-zinc-900 dark:hover:text-zinc-100 hover:ring-zinc-300"
    >
      Has site <ExternalLink className="h-3 w-3" />
    </a>
  );
}

function RegistryBadge({ status, businessId }: { status: string; businessId: string | null }) {
  const styles: Record<string, string> = {
    matched:
      "bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/25",
    low_confidence:
      "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/25",
    no_match: "bg-zinc-50 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 ring-zinc-200 dark:ring-zinc-700",
    unchecked: "bg-zinc-50 dark:bg-zinc-950 text-zinc-400 dark:text-zinc-500 ring-zinc-200 dark:ring-zinc-700",
  };
  const labels: Record<string, string> = {
    matched: businessId ?? "Matched",
    low_confidence: businessId ?? "Low confidence",
    no_match: "No match",
    unchecked: "Unchecked",
  };
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        businessId && (status === "matched" || status === "low_confidence")
          ? "font-mono tracking-tight"
          : null,
        styles[status] ?? styles.unchecked,
      )}
      title={status === "low_confidence" ? "Low-confidence registry match" : undefined}
    >
      {labels[status] ?? status}
    </span>
  );
}

export function LeadsTable({ leads }: { leads: LeadRow[] }) {
  const [noWebOnly, setNoWebOnly] = useState(true);
  const [query, setQuery] = useState("");
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads.filter((l) => {
      if (noWebOnly && l.website_status === "has_website") return false;
      if (!q) return true;
      return `${l.name} ${l.address ?? ""} ${l.category ?? ""}`
        .toLowerCase()
        .includes(q);
    });
  }, [leads, noWebOnly, query]);

  function onStatusChange(id: string, status: string) {
    startTransition(async () => {
      await updateLeadStatus(id, status);
    });
  }

  function onDelete(id: string, name: string) {
    if (!confirm(`Delete lead "${name}"? This cannot be undone.`)) return;
    startTransition(async () => {
      await deleteLead(id);
    });
  }

  const segmented = [
    { label: "Opportunities", value: true },
    { label: "All leads", value: false },
  ] as const;

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 px-4 py-3">
        <div
          role="group"
          aria-label="Website status filter"
          className="inline-flex rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-0.5"
        >
          {segmented.map((seg) => (
            <button
              key={seg.label}
              type="button"
              aria-pressed={noWebOnly === seg.value}
              onClick={() => setNoWebOnly(seg.value)}
              className={cn(
                "cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition",
                noWebOnly === seg.value
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-700"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100",
              )}
            >
              {seg.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by name, area, category…"
            aria-label="Filter leads"
            className="w-60 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 py-1.5 pl-9 pr-3 text-sm text-zinc-900 dark:text-zinc-100 outline-none transition placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 text-xs font-medium tabular-nums text-zinc-600 dark:text-zinc-300">
          {filtered.length} / {leads.length}
        </span>

        <a
          href="/dashboard/leads/export"
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 shadow-sm transition hover:border-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
        >
          <Download className="h-4 w-4" /> Export CSV
        </a>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/70 text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">Business</th>
              <th className="px-4 py-3 font-medium">Website</th>
              <th className="px-4 py-3 font-medium">Registry</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {filtered.map((l) => (
              <tr
                key={l.id}
                className="group align-top transition-colors hover:bg-indigo-50/30"
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-zinc-900 dark:text-zinc-100">{l.name}</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">{l.address ?? "—"}</div>
                  <div className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
                    {[l.category, l.phone].filter(Boolean).join(" · ") || "—"}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <WebsiteBadge status={l.website_status} website={l.website} />
                </td>
                <td className="px-4 py-3">
                  <RegistryBadge status={l.registry_status} businessId={l.business_id} />
                </td>
                <td className="px-4 py-3">
                  <div className="relative inline-flex items-center">
                    <span
                      aria-hidden
                      className={cn(
                        "pointer-events-none absolute left-2.5 h-2 w-2 rounded-full",
                        CRM_DOT[l.crm_status] ?? "bg-zinc-300",
                      )}
                    />
                    <select
                      defaultValue={l.crm_status}
                      onChange={(e) => onStatusChange(l.id, e.target.value)}
                      aria-label={`CRM status for ${l.name}`}
                      className="cursor-pointer appearance-none rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-1.5 pl-7 pr-7 text-xs font-medium capitalize text-zinc-700 dark:text-zinc-300 shadow-sm outline-none transition hover:border-zinc-300 dark:hover:border-zinc-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    >
                      {CRM_STATUSES.map((s) => (
                        <option key={s} value={s} className="capitalize">
                          {s}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      aria-hidden
                      className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500"
                    />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <Link
                      href={`/dashboard/sites/new?leadId=${l.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-1.5 text-xs font-medium text-white opacity-90 shadow-sm shadow-indigo-600/20 transition hover:opacity-100 hover:brightness-110"
                    >
                      <Wand2 className="h-3.5 w-3.5" /> Build site
                    </Link>
                    <button
                      onClick={() => onDelete(l.id, l.name)}
                      aria-label={`Delete lead ${l.name}`}
                      title="Delete lead"
                      className="cursor-pointer rounded-lg p-2 text-zinc-400 dark:text-zinc-500 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 ? (
          leads.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 ring-1 ring-inset ring-indigo-100 dark:ring-indigo-500/20">
                <Inbox className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                No leads yet
              </h3>
              <p className="mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
                Run your first search above — try a niche like{" "}
                <span className="font-medium text-zinc-700 dark:text-zinc-300">barbershop</span> in
                your city, and leads will land here.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500">
                <SearchX className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                No leads match your filters
              </h3>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Try clearing the filters to see all {leads.length} leads.
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setNoWebOnly(false);
                }}
                className="mt-4 cursor-pointer rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 shadow-sm transition hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                Clear filters
              </button>
            </div>
          )
        ) : null}
      </div>
    </div>
  );
}
