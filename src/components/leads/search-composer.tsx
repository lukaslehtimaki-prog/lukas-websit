"use client";

import { useActionState, useState } from "react";
import {
  Search,
  Loader2,
  MapPin,
  Store,
  Radar,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { runSearchAction, type SearchState } from "@/app/dashboard/leads/actions";

const initial: SearchState = {};

const examples = [
  { niche: "Barbershop", location: "Helsinki" },
  { niche: "Hairdresser", location: "Tampere" },
  { niche: "Gym", location: "Turku" },
  { niche: "Restaurant", location: "Oulu" },
];

const inputClass =
  "w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 py-2 pl-9 pr-3 text-sm text-zinc-900 dark:text-zinc-100 outline-none transition placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

export function SearchComposer() {
  const [state, formAction, pending] = useActionState(runSearchAction, initial);
  const [niche, setNiche] = useState("");
  const [location, setLocation] = useState("");

  return (
    <form
      action={formAction}
      aria-busy={pending}
      className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm"
    >
      {/* header strip */}
      <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 bg-gradient-to-r from-indigo-50/70 via-white to-white dark:from-indigo-500/10 dark:via-zinc-900 dark:to-zinc-900 px-4 py-2.5">
        <Sparkles className="h-4 w-4 text-indigo-500" />
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">New search</span>
        <span className="ml-auto hidden text-xs text-zinc-400 dark:text-zinc-500 sm:block">
          Google Places · YTJ cross-check
        </span>
      </div>

      <div className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1 space-y-1.5">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
              Niche / business type
            </span>
            <div className="relative">
              <Store className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
              <input
                name="niche"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder="e.g. barbershop, gym, hairdresser"
                className={inputClass}
                required
              />
            </div>
          </label>
          <label className="flex-1 space-y-1.5">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Location</span>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
              <input
                name="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Helsinki"
                className={inputClass}
              />
            </div>
          </label>
          <label className="space-y-1.5 sm:w-32">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Radius</span>
            <div className="relative">
              <Radar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
              <select
                name="radiusKm"
                defaultValue="5"
                className={`${inputClass} cursor-pointer appearance-none`}
              >
                <option value="2">2 km</option>
                <option value="5">5 km</option>
                <option value="10">10 km</option>
                <option value="20">20 km</option>
                <option value="50">50 km</option>
              </select>
            </div>
          </label>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-[42px] cursor-pointer items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-5 text-sm font-medium text-white shadow-sm shadow-indigo-600/25 transition-all duration-200 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            {pending ? "Searching…" : "Search"}
          </button>
        </div>

        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          <span className="text-xs text-zinc-400 dark:text-zinc-500">Try:</span>
          {examples.map((ex) => (
            <button
              key={ex.niche}
              type="button"
              onClick={() => {
                setNiche(ex.niche);
                setLocation(ex.location);
              }}
              className="cursor-pointer rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 px-3 py-1 text-xs text-zinc-600 dark:text-zinc-300 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 dark:hover:text-indigo-300"
            >
              {ex.niche} in {ex.location}
            </button>
          ))}
        </div>

        {state.error ? (
          <p
            className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-300"
            role="alert"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {state.error}
          </p>
        ) : null}
        {state.ok ? (
          <p
            className="mt-3 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300"
            aria-live="polite"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
