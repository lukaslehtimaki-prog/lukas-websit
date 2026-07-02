"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  RefreshCw,
  Save,
  Trash2,
  Plus,
  X,
  Loader2,
} from "lucide-react";
import {
  updateSiteContent,
  regenerateContent,
  setSiteStatus,
  deleteSite,
} from "@/app/dashboard/sites/actions";
import { renderSiteToHtml } from "@/lib/templates/render";
import { TEMPLATES, type SiteContent } from "@/lib/templates/types";
import { cn } from "@/lib/utils";

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 50) || "website"
  );
}

export function SiteEditor({
  siteId,
  initialTemplateId,
  initialStatus,
  initialContent,
  aiEnabled,
}: {
  siteId: string;
  initialTemplateId: string;
  initialStatus: string;
  initialContent: SiteContent;
  aiEnabled: boolean;
}) {
  const [content, setContent] = useState<SiteContent>(initialContent);
  const [templateId, setTemplateId] = useState(initialTemplateId);
  const [status, setStatus] = useState(initialStatus);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const html = useMemo(
    () => renderSiteToHtml(content, templateId),
    [content, templateId],
  );

  function patch(p: Partial<SiteContent>) {
    setContent((prev) => ({ ...prev, ...p }));
  }
  function patchContact(p: Partial<SiteContent["contact"]>) {
    setContent((prev) => ({ ...prev, contact: { ...prev.contact, ...p } }));
  }

  function save() {
    startTransition(async () => {
      const r = await updateSiteContent(siteId, content, templateId);
      setMessage(r.error ?? "Saved ✓");
    });
  }
  function regenerate() {
    setMessage(null);
    startTransition(async () => {
      const r = await regenerateContent(siteId);
      if (r.content) setContent(r.content);
      setMessage(r.error ?? "Regenerated ✓");
    });
  }
  function changeStatus(s: string) {
    setStatus(s);
    startTransition(async () => {
      await setSiteStatus(siteId, s);
    });
  }
  function onDelete() {
    if (!confirm("Delete this website? This cannot be undone.")) return;
    startTransition(async () => {
      await deleteSite(siteId);
    });
  }
  function download() {
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slugify(content.businessName)}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/dashboard/sites"
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
        >
          <ArrowLeft className="h-4 w-4" /> Sites
        </Link>

        <select
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
          className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
          title="Template"
        >
          {TEMPLATES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => changeStatus(e.target.value)}
          className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm capitalize"
          title="Status"
        >
          <option value="draft">Draft</option>
          <option value="generated">Generated</option>
          <option value="published">Published</option>
        </select>

        <div className="ml-auto flex items-center gap-2">
          {message ? (
            <span className="text-xs text-zinc-500">{message}</span>
          ) : null}
          {aiEnabled ? (
            <button
              onClick={regenerate}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-60"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Regenerate
            </button>
          ) : null}
          <button
            onClick={download}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-zinc-50"
          >
            <Download className="h-4 w-4" /> Download
          </button>
          <button
            onClick={save}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60"
          >
            <Save className="h-4 w-4" /> Save
          </button>
          <button
            onClick={onDelete}
            className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-red-50 hover:text-red-600"
            title="Delete site"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Editor */}
        <div className="space-y-5">
          <Section title="Hero">
            <Text label="Business name" value={content.businessName} onChange={(v) => patch({ businessName: v })} />
            <Text label="Tagline" value={content.tagline} onChange={(v) => patch({ tagline: v })} />
            <Text label="Heading" value={content.heroHeading} onChange={(v) => patch({ heroHeading: v })} />
            <Text label="Subtext" value={content.heroSubtext} onChange={(v) => patch({ heroSubtext: v })} textarea />
            <Text label="Button text" value={content.ctaText} onChange={(v) => patch({ ctaText: v })} />
          </Section>

          <Section title="About">
            <Text label="About paragraph" value={content.about} onChange={(v) => patch({ about: v })} textarea />
            <ListEditor
              label="Highlights"
              items={content.highlights}
              onChange={(highlights) => patch({ highlights })}
              placeholder="e.g. 20 years of experience"
            />
          </Section>

          <Section title="Services">
            <div className="space-y-3">
              {content.services.map((s, i) => (
                <div key={i} className="rounded-lg border border-zinc-200 p-3">
                  <div className="flex items-center gap-2">
                    <input
                      value={s.title}
                      onChange={(e) =>
                        patch({
                          services: content.services.map((x, idx) =>
                            idx === i ? { ...x, title: e.target.value } : x,
                          ),
                        })
                      }
                      placeholder="Service name"
                      className="flex-1 rounded-md border border-zinc-300 px-2 py-1.5 text-sm font-medium"
                    />
                    <button
                      onClick={() =>
                        patch({ services: content.services.filter((_, idx) => idx !== i) })
                      }
                      className="rounded p-1 text-zinc-400 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <textarea
                    value={s.description}
                    onChange={(e) =>
                      patch({
                        services: content.services.map((x, idx) =>
                          idx === i ? { ...x, description: e.target.value } : x,
                        ),
                      })
                    }
                    placeholder="Short description"
                    rows={2}
                    className="mt-2 w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
                  />
                </div>
              ))}
              <button
                onClick={() =>
                  patch({
                    services: [...content.services, { title: "Uusi palvelu", description: "" }],
                  })
                }
                className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800"
              >
                <Plus className="h-4 w-4" /> Add service
              </button>
            </div>
          </Section>

          <Section title="Contact">
            <Text label="Address" value={content.contact.address ?? ""} onChange={(v) => patchContact({ address: v, mapsQuery: v || content.businessName })} />
            <Text label="Phone" value={content.contact.phone ?? ""} onChange={(v) => patchContact({ phone: v })} />
            <Text label="Email" value={content.contact.email ?? ""} onChange={(v) => patchContact({ email: v })} />
            {content.contact.hours?.length ? (
              <p className="text-xs text-zinc-400">
                Opening hours imported from Google: {content.contact.hours.length} day(s).
              </p>
            ) : null}
          </Section>
        </div>

        {/* Live preview */}
        <div className="lg:sticky lg:top-4 lg:h-[calc(100vh-7rem)]">
          <div className="h-[640px] overflow-hidden rounded-xl border border-zinc-200 bg-white lg:h-full">
            <iframe
              title="Website preview"
              srcDoc={html}
              className="h-full w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-zinc-900">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Text({
  label,
  value,
  onChange,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-zinc-600">{label}</span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
        />
      )}
    </label>
  );
}

function ListEditor({
  label,
  items,
  onChange,
  placeholder,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <span className="text-xs font-medium text-zinc-600">{label}</span>
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            value={item}
            onChange={(e) => onChange(items.map((x, idx) => (idx === i ? e.target.value : x)))}
            placeholder={placeholder}
            className="flex-1 rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
          />
          <button
            onClick={() => onChange(items.filter((_, idx) => idx !== i))}
            className="rounded p-1 text-zinc-400 hover:text-red-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange([...items, ""])}
        className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800"
      >
        <Plus className="h-4 w-4" /> Add
      </button>
    </div>
  );
}
