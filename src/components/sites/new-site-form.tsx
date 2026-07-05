"use client";

import { useActionState, useState } from "react";
import { Loader2, Wand2 } from "lucide-react";
import {
  createSiteFromLead,
  createSiteFromInput,
  type NewSiteState,
} from "@/app/dashboard/sites/actions";
import { TEMPLATES } from "@/lib/templates/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type LeadOption = {
  id: string;
  name: string;
  address: string | null;
  website_status: string;
};

const inputClass =
  "w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none transition placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

export function NewSiteForm({
  leads,
  preselectedLeadId,
}: {
  leads: LeadOption[];
  preselectedLeadId: string | null;
}) {
  const [mode, setMode] = useState<"lead" | "link">(
    preselectedLeadId || leads.length ? "lead" : "link",
  );
  const [templateId, setTemplateId] = useState<string>(TEMPLATES[0].id);
  const [leadState, leadAction, leadPending] = useActionState(
    createSiteFromLead,
    {} as NewSiteState,
  );
  const [linkState, linkAction, linkPending] = useActionState(
    createSiteFromInput,
    {} as NewSiteState,
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">1. Choose a template</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTemplateId(t.id)}
              className={cn(
                "rounded-xl border p-4 text-left transition",
                templateId === t.id
                  ? "border-indigo-500 ring-2 ring-indigo-100 dark:ring-indigo-500/20"
                  : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600",
              )}
            >
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ background: t.accent }}
              />
              <p className="mt-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">{t.name}</p>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{t.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">2. Choose the source</p>
        <div className="mb-3 inline-flex rounded-lg border border-zinc-200 dark:border-zinc-800 p-0.5 text-sm">
          <button
            type="button"
            onClick={() => setMode("lead")}
            className={cn(
              "rounded-md px-3 py-1.5",
              mode === "lead" ? "bg-zinc-900 text-white" : "text-zinc-600 dark:text-zinc-300",
            )}
          >
            From a lead
          </button>
          <button
            type="button"
            onClick={() => setMode("link")}
            className={cn(
              "rounded-md px-3 py-1.5",
              mode === "link" ? "bg-zinc-900 text-white" : "text-zinc-600 dark:text-zinc-300",
            )}
          >
            From a link
          </button>
        </div>

        {mode === "lead" ? (
          <form
            action={leadAction}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4"
          >
            <input type="hidden" name="templateId" value={templateId} />
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Lead</span>
              <select
                name="leadId"
                defaultValue={preselectedLeadId ?? ""}
                required
                className={inputClass}
              >
                <option value="" disabled>
                  {leads.length ? "Select a lead…" : "No leads yet — run a search first"}
                </option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                    {l.website_status === "no_website" ? " — no website" : ""}
                    {l.address ? ` · ${l.address}` : ""}
                  </option>
                ))}
              </select>
            </label>
            {leadState.error ? (
              <p className="mt-3 text-sm text-red-600">{leadState.error}</p>
            ) : null}
            <Button type="submit" disabled={leadPending} className="mt-4">
              {leadPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              {leadPending ? "Generating…" : "Generate website"}
            </Button>
          </form>
        ) : (
          <form
            action={linkAction}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4"
          >
            <input type="hidden" name="templateId" value={templateId} />
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                Google Maps link, or business name + city
              </span>
              <input
                name="input"
                placeholder="https://maps.google.com/…  or  Parturi Helsinki"
                required
                className={inputClass}
              />
            </label>
            {linkState.error ? (
              <p className="mt-3 text-sm text-red-600">{linkState.error}</p>
            ) : null}
            <Button type="submit" disabled={linkPending} className="mt-4">
              {linkPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              {linkPending ? "Generating…" : "Generate website"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
