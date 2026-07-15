"use client";

import {
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ChangeEvent,
  type ReactNode,
} from "react";
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
  Shuffle,
  Globe,
  Copy,
  ExternalLink,
  ImagePlus,
  Lock,
  Mail,
  Send,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  updateSiteContent,
  regenerateContent,
  setSiteStatus,
  deleteSite,
  uploadSiteImageAction,
  importGooglePhotosAction,
  generatePitchAction,
  sendPitchAction,
} from "@/app/dashboard/sites/actions";
import { renderSiteToHtml } from "@/lib/templates/render";
import { renderPitchEmailHtml } from "@/lib/email/pitch-template";
import { defaultMembershipPlans } from "@/lib/templates/site-kind";
import { THEMES } from "@/lib/templates/themes";
import { SUPPORTED_LANGUAGES } from "@/lib/templates/i18n";
import {
  TEMPLATES,
  DEFAULT_SECTION_ORDER,
  type SiteContent,
  type MembershipPlan,
  type SiteKind,
  type SectionId,
  type SiteTeamMember,
  type SiteSocial,
  type SocialPlatform,
} from "@/lib/templates/types";
import { cn } from "@/lib/utils";

const fieldCls =
  "rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500";

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
  emailEnabled,
  senderName,
  pitchAllowed,
}: {
  siteId: string;
  initialTemplateId: string;
  initialStatus: string;
  initialContent: SiteContent;
  aiEnabled: boolean;
  emailEnabled: boolean;
  senderName: string;
  pitchAllowed: boolean;
}) {
  const [content, setContent] = useState<SiteContent>(initialContent);
  const [templateId, setTemplateId] = useState(initialTemplateId);
  const [status, setStatus] = useState(initialStatus);
  const [message, setMessage] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const [uploading, setUploading] = useState<
    null | "hero" | "gallery" | "google"
  >(null);
  const [pitch, setPitch] = useState<{ subject: string; body: string } | null>(
    null,
  );
  const [pitchTo, setPitchTo] = useState("");
  const [pitchBusy, setPitchBusy] = useState<null | "draft" | "send">(null);
  const [pitchSent, setPitchSent] = useState(false);
  const [offerPrice, setOfferPrice] = useState(
    initialContent.payment?.priceStr || "500 €",
  );
  const [offerLink, setOfferLink] = useState(initialContent.payment?.link ?? "");
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [isPending, startTransition] = useTransition();

  // One-time sync from browser-only sources (location, localStorage) after
  // hydration — values the server render can't know.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrigin(window.location.origin);
    // The asking price tends to be the same deal-to-deal — remember it. The
    // payment link is per-site (auto-created by Stripe), so it is not shared.
    try {
      const saved = JSON.parse(
        localStorage.getItem("sitovai.pitch.offer") ?? "{}",
      ) as { price?: string };
      if (saved.price && !initialContent.payment?.priceStr)
         
        setOfferPrice(saved.price);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(
        "sitovai.pitch.offer",
        JSON.stringify({ price: offerPrice }),
      );
    } catch {}
  }, [offerPrice]);
  const liveUrl = `${origin}/s/${siteId}`;

  const html = useMemo(
    () =>
      renderSiteToHtml(content, templateId, {
        // Absolute URL: works from the srcDoc preview iframe and from
        // downloaded HTML hosted anywhere.
        formAction: origin ? `${origin}/api/f/${siteId}` : null,
      }),
    [content, templateId, origin, siteId],
  );
  const emailHtml = useMemo(
    () =>
      pitch
        ? renderPitchEmailHtml({
            body: pitch.body,
            businessName: content.businessName,
            tagline: content.tagline,
            language: content.language ?? "fi",
            liveUrl,
            senderName,
            heroImage: content.heroImage,
            offer: { price: offerPrice, paymentLink: offerLink },
          })
        : "",
    [pitch, content, liveUrl, senderName, offerPrice, offerLink],
  );

  function patch(p: Partial<SiteContent>) {
    setContent((prev) => ({ ...prev, ...p }));
  }
  function patchContact(p: Partial<SiteContent["contact"]>) {
    setContent((prev) => ({ ...prev, contact: { ...prev.contact, ...p } }));
  }
  function shuffleStyle() {
    setMessage("New style — Save to keep it");
    patch({
      designSeed: Math.floor(Math.random() * 1_000_000),
      themeId: undefined,
    });
  }
  function setKind(kind: SiteKind) {
    patch({
      kind,
      membershipPlans:
        kind === "membership" && !content.membershipPlans?.length
          ? defaultMembershipPlans(content.language)
          : content.membershipPlans,
    });
  }
  function importFromGoogle() {
    setUploading("google");
    startTransition(async () => {
      const r = await importGooglePhotosAction(siteId);
      if (r.error) {
        setMessage(r.error);
      } else if (r.urls?.length) {
        const hadHero = Boolean(content.heroImage);
        patch({
          heroImage: content.heroImage ?? r.urls[0],
          gallery: [
            ...(content.gallery ?? []),
            ...(hadHero ? r.urls : r.urls.slice(1)),
          ],
        });
        setMessage(`Imported ${r.urls.length} photos ✓ — Save to keep them`);
      }
      setUploading(null);
    });
  }
  function setPlans(next: MembershipPlan[]) {
    patch({ membershipPlans: next });
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
  function publish() {
    startTransition(async () => {
      await updateSiteContent(siteId, content, templateId);
      await setSiteStatus(siteId, "published");
      setStatus("published");
      setMessage("Published ✓ — live link ready");
    });
  }
  function copyLink() {
    navigator.clipboard?.writeText(liveUrl);
    setMessage("Link copied ✓");
  }
  function draftPitch() {
    setPitchBusy("draft");
    startTransition(async () => {
      const r = await generatePitchAction(siteId, offerPrice);
      if (r.error) {
        setMessage(r.error);
      } else {
        setPitch({ subject: r.subject ?? "", body: r.body ?? "" });
        if (r.to) setPitchTo((prev) => prev || r.to || "");
        if (r.paymentLink) setOfferLink(r.paymentLink);
        if (r.paymentNote) setMessage(r.paymentNote);
        setPitchSent(false);
      }
      setPitchBusy(null);
    });
  }
  function sendPitch() {
    if (!pitch) return;
    setPitchBusy("send");
    startTransition(async () => {
      const r = await sendPitchAction(siteId, pitchTo, pitch.subject, pitch.body, {
        price: offerPrice,
        paymentLink: offerLink,
      });
      if (r.error) {
        setMessage(r.error);
      } else {
        setPitchSent(true);
        setStatus("published");
        setMessage("Email sent ✓ — site is now published");
      }
      setPitchBusy(null);
    });
  }
  async function uploadImage(file: File): Promise<string | null> {
    const fd = new FormData();
    fd.append("siteId", siteId);
    fd.append("file", file);
    const r = await uploadSiteImageAction(fd);
    if (r.error) {
      setMessage(r.error);
      return null;
    }
    return r.url ?? null;
  }
  function onHeroFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading("hero");
    startTransition(async () => {
      const url = await uploadImage(file);
      if (url) patch({ heroImage: url });
      setUploading(null);
    });
  }
  function onGalleryFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    setUploading("gallery");
    startTransition(async () => {
      const urls: string[] = [];
      for (const f of files) {
        const u = await uploadImage(f);
        if (u) urls.push(u);
      }
      if (urls.length) patch({ gallery: [...(content.gallery ?? []), ...urls] });
      setUploading(null);
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
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" /> Sites
        </Link>

        <select
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
          className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
          title="Template category"
        >
          {TEMPLATES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        <button
          onClick={shuffleStyle}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 px-2.5 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 dark:hover:text-indigo-300"
          title="Shuffle the visual design (palette, fonts, layout)"
        >
          <Shuffle className="h-4 w-4" /> Shuffle
        </button>

        <select
          value={content.themeId ?? "auto"}
          onChange={(e) =>
            patch({
              themeId: e.target.value === "auto" ? undefined : e.target.value,
            })
          }
          className={cn("max-w-[220px] cursor-pointer", fieldCls)}
          title="Visual style"
        >
          <option value="auto">Style: Auto</option>
          {THEMES.map((th) => (
            <option key={th.id} value={th.id}>
              {th.label}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => changeStatus(e.target.value)}
          className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 capitalize"
          title="Status"
        >
          <option value="draft">Draft</option>
          <option value="generated">Generated</option>
          <option value="published">Published</option>
        </select>

        <div className="ml-auto flex items-center gap-2">
          {message ? (
            <span className="text-xs text-zinc-500 dark:text-zinc-400">{message}</span>
          ) : null}
          {aiEnabled ? (
            <button
              onClick={regenerate}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 transition hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-60"
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
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 transition hover:bg-zinc-50 dark:hover:bg-zinc-800"
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
            className="rounded-lg p-1.5 text-zinc-400 dark:text-zinc-500 transition hover:bg-red-50 hover:text-red-600"
            title="Delete site"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Publish */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {status === "published" ? (
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-100 dark:bg-emerald-500/15">
                <Globe className="h-3.5 w-3.5" />
              </span>
              Live website
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <input
                readOnly
                value={liveUrl}
                onFocus={(e) => e.currentTarget.select()}
                className={cn("min-w-0 flex-1 font-mono text-xs", fieldCls)}
              />
              <button
                onClick={copyLink}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <Copy className="h-4 w-4" /> Copy
              </button>
              <a
                href={liveUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <ExternalLink className="h-4 w-4" /> Open
              </a>
              <button
                onClick={() => changeStatus("generated")}
                className="rounded-lg px-3 py-1.5 text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Unpublish
              </button>
            </div>
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              Share this link with the client. Changes go live when you Save. To
              use a custom domain, point it here.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Publish this website
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                One click puts it online at a shareable link — no hosting setup.
              </p>
            </div>
            <button
              onClick={publish}
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:brightness-110 disabled:opacity-60"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Globe className="h-4 w-4" />
              )}
              Publish website
            </button>
          </div>
        )}
      </div>

      {/* Pitch email */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
            <Mail className="h-3.5 w-3.5" />
          </span>
          Pitch it to the business
          {content.payment?.paidAt ? (
            <span className="ml-auto rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
              Sold 🎉
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          AI drafts a sales email in the site&apos;s language, delivered as a
          designed email with the site preview, a view button and an optional
          Buy button. Sending publishes the site automatically — replies go
          straight to your email.
        </p>
        {!pitchAllowed ? (
          <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-950">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              <Lock className="h-4 w-4" />
            </span>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Pitch emails with one-click buy are a{" "}
              <span className="font-semibold">Pro</span> feature.
            </p>
            <Link
              href="/dashboard/billing"
              className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:brightness-110"
            >
              Upgrade to Pro
            </Link>
          </div>
        ) : pitch === null ? (
          <button
            onClick={draftPitch}
            disabled={pitchBusy !== null || isPending}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:brightness-110 disabled:opacity-60"
          >
            {pitchBusy === "draft" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Draft sales email
          </button>
        ) : (
          <div className="mt-3 space-y-2.5">
            <input
              value={pitchTo}
              onChange={(e) => setPitchTo(e.target.value)}
              placeholder="business@example.com"
              type="email"
              aria-label="Recipient email"
              className={cn("w-full", fieldCls)}
            />
            <input
              value={pitch.subject}
              onChange={(e) => setPitch({ ...pitch, subject: e.target.value })}
              aria-label="Subject"
              className={cn("w-full font-medium", fieldCls)}
            />
            <textarea
              value={pitch.body}
              onChange={(e) => setPitch({ ...pitch, body: e.target.value })}
              rows={9}
              aria-label="Message"
              className={cn("w-full", fieldCls)}
            />
            <div className="grid gap-2.5 sm:grid-cols-[8rem_1fr]">
              <input
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                placeholder="Price, e.g. 299 €"
                aria-label="Price"
                className={cn("w-full", fieldCls)}
              />
              <input
                value={offerLink}
                onChange={(e) => setOfferLink(e.target.value)}
                placeholder="Payment link — auto-created by Stripe, or paste your own"
                aria-label="Payment link"
                type="url"
                className={cn("w-full", fieldCls)}
              />
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              The Stripe payment link is created automatically for your asking
              price — the email gets a one-click{" "}
              <span className="font-medium">Buy this website</span> button and
              the money lands in your Stripe. Change the price and it updates on
              send. Paste your own link to override, or clear the price to sell
              by reply.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {emailEnabled ? (
                <button
                  onClick={sendPitch}
                  disabled={pitchBusy !== null || isPending}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:brightness-110 disabled:opacity-60"
                >
                  {pitchBusy === "send" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Send email
                </button>
              ) : null}
              <a
                href={`mailto:${pitchTo}?subject=${encodeURIComponent(pitch.subject)}&body=${encodeURIComponent(pitch.body)}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <ExternalLink className="h-4 w-4" /> Open in email app
              </a>
              <button
                onClick={() => setShowEmailPreview((v) => !v)}
                className="rounded-lg px-3 py-2 text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                {showEmailPreview ? "Hide preview" : "Preview email"}
              </button>
              <button
                onClick={draftPitch}
                disabled={pitchBusy !== null}
                className="rounded-lg px-3 py-2 text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Redraft
              </button>
              {pitchSent ? (
                <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  Sent ✓
                </span>
              ) : null}
            </div>
            {showEmailPreview ? (
              <iframe
                srcDoc={emailHtml}
                title="Email preview"
                sandbox=""
                className="h-[480px] w-full rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-800"
              />
            ) : null}
          </div>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Editor */}
        <div className="space-y-5">
          <Section title="Site type">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Adds the right section: a booking form for appointment businesses,
              or membership pricing for gyms &amp; studios.
            </p>
            <select
              value={content.kind ?? "standard"}
              onChange={(e) => setKind(e.target.value as SiteKind)}
              className={cn("w-full cursor-pointer appearance-none", fieldCls)}
            >
              <option value="standard">Standard</option>
              <option value="booking">Booking — barber, salon, clinic</option>
              <option value="membership">Membership — gym, studio</option>
            </select>
          </Section>

          <Section title="Sections & layout">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Reorder the page or hide sections. The hero and contact sections
              are always shown.
            </p>
            <SectionManager content={content} onChange={patch} />
          </Section>

          <Section title="Language">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Detected from the business&apos;s country. Headings switch
              instantly — click Regenerate to rewrite the copy in this language.
            </p>
            <select
              value={content.language ?? "fi"}
              onChange={(e) => patch({ language: e.target.value })}
              className={cn("w-full cursor-pointer appearance-none", fieldCls)}
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </Section>

          <Section title="Hero">
            <Text label="Business name" value={content.businessName} onChange={(v) => patch({ businessName: v })} />
            <Text label="Tagline" value={content.tagline} onChange={(v) => patch({ tagline: v })} />
            <Text label="Heading" value={content.heroHeading} onChange={(v) => patch({ heroHeading: v })} />
            <Text label="Subtext" value={content.heroSubtext} onChange={(v) => patch({ heroSubtext: v })} textarea />
            <Text label="Button text" value={content.ctaText} onChange={(v) => patch({ ctaText: v })} />
          </Section>

          <Section title="Images">
            <button
              type="button"
              onClick={importFromGoogle}
              disabled={uploading !== null || isPending}
              className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-indigo-300 bg-indigo-50/50 px-3 py-2 text-sm font-medium text-indigo-700 transition hover:bg-indigo-50 disabled:opacity-60 dark:border-indigo-500/40 dark:bg-indigo-500/10 dark:text-indigo-300"
            >
              {uploading === "google" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {uploading === "google"
                ? "Importing from Google…"
                : "Import the business's Google photos"}
            </button>
            <div>
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                Hero image
              </span>
              {content.heroImage ? (
                <div className="relative mt-1.5 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={content.heroImage}
                    alt="Hero"
                    className="h-32 w-full object-cover"
                  />
                  <button
                    onClick={() => patch({ heroImage: null })}
                    className="absolute right-2 top-2 rounded-md bg-black/60 p-1 text-white hover:bg-black/80"
                    title="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="mt-1.5 flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-zinc-300 py-6 text-sm text-zinc-500 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-indigo-500">
                  {uploading === "hero" ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <ImagePlus className="h-5 w-5" />
                  )}
                  {uploading === "hero" ? "Uploading…" : "Upload hero image"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onHeroFile}
                  />
                </label>
              )}
            </div>
            <div>
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                Gallery
              </span>
              <div className="mt-1.5 grid grid-cols-3 gap-2">
                {(content.gallery ?? []).map((url, i) => (
                  <div
                    key={i}
                    className="relative overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="h-20 w-full object-cover" />
                    <button
                      onClick={() =>
                        patch({
                          gallery: (content.gallery ?? []).filter(
                            (_, idx) => idx !== i,
                          ),
                        })
                      }
                      className="absolute right-1 top-1 rounded bg-black/60 p-0.5 text-white hover:bg-black/80"
                      title="Remove image"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                <label className="flex h-20 cursor-pointer items-center justify-center rounded-lg border border-dashed border-zinc-300 text-zinc-400 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-zinc-700 dark:hover:border-indigo-500">
                  {uploading === "gallery" ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Plus className="h-5 w-5" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={onGalleryFiles}
                  />
                </label>
              </div>
            </div>
          </Section>

          <Section title="Brand colour">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Override the theme accent used for buttons, headings and
              highlights. Leave blank to use the theme&apos;s own colour.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={content.accent || "#4f46e5"}
                onChange={(e) => patch({ accent: e.target.value })}
                aria-label="Brand colour"
                className="h-9 w-12 cursor-pointer rounded-md border border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-950"
              />
              <input
                value={content.accent ?? ""}
                onChange={(e) => patch({ accent: e.target.value })}
                placeholder="#0e7c5a"
                className={cn("flex-1 font-mono", fieldCls)}
              />
              {content.accent ? (
                <button
                  onClick={() => patch({ accent: null })}
                  className="rounded-md px-2 py-1.5 text-xs text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  Reset
                </button>
              ) : null}
            </div>
          </Section>

          <Section title="Announcement bar">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              A thin banner across the very top of the site. Great for offers,
              opening hours, or a phone number. Leave blank to hide it.
            </p>
            <Text
              label="Banner text"
              value={content.announcement ?? ""}
              onChange={(v) => patch({ announcement: v })}
            />
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
                <div key={i} className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
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
                      className="flex-1 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 font-medium"
                    />
                    <button
                      onClick={() =>
                        patch({ services: content.services.filter((_, idx) => idx !== i) })
                      }
                      className="rounded p-1 text-zinc-400 dark:text-zinc-500 hover:text-red-600"
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
                    className="mt-2 w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                  />
                  <input
                    value={s.price ?? ""}
                    onChange={(e) =>
                      patch({
                        services: content.services.map((x, idx) =>
                          idx === i ? { ...x, price: e.target.value } : x,
                        ),
                      })
                    }
                    placeholder="Price (optional) — e.g. from 90 €"
                    className="mt-2 w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                  />
                </div>
              ))}
              <button
                onClick={() =>
                  patch({
                    services: [...content.services, { title: "Uusi palvelu", description: "" }],
                  })
                }
                className="inline-flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800"
              >
                <Plus className="h-4 w-4" /> Add service
              </button>
            </div>
          </Section>

          <Section title="Team">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Add staff to show a &ldquo;Meet the team&rdquo; section. Leave
              empty to hide it.
            </p>
            <div className="space-y-2">
              {(content.team ?? []).map((m, i) => {
                const team = content.team ?? [];
                const upd = (u: Partial<SiteTeamMember>) =>
                  patch({
                    team: team.map((x, idx) => (idx === i ? { ...x, ...u } : x)),
                  });
                return (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      value={m.name}
                      onChange={(e) => upd({ name: e.target.value })}
                      placeholder="Name"
                      className={cn("flex-1 font-medium", fieldCls)}
                    />
                    <input
                      value={m.role}
                      onChange={(e) => upd({ role: e.target.value })}
                      placeholder="Role"
                      className={cn("flex-1", fieldCls)}
                    />
                    <button
                      onClick={() =>
                        patch({ team: team.filter((_, idx) => idx !== i) })
                      }
                      className="rounded p-1 text-zinc-400 hover:text-red-600 dark:text-zinc-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
              <button
                onClick={() =>
                  patch({
                    team: [...(content.team ?? []), { name: "", role: "" }],
                  })
                }
                className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
              >
                <Plus className="h-4 w-4" /> Add team member
              </button>
            </div>
          </Section>

          <Section title="Special offer">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              A highlighted offer band. Fill in a title to show it; leave the
              title blank to hide it.
            </p>
            <Text
              label="Offer title"
              value={content.offer?.title ?? ""}
              onChange={(v) =>
                patch({ offer: { ...(content.offer ?? { text: "" }), title: v } })
              }
            />
            <Text
              label="Offer text"
              value={content.offer?.text ?? ""}
              onChange={(v) =>
                patch({ offer: { ...(content.offer ?? { title: "" }), text: v } })
              }
            />
            <Text
              label="Discount code (optional)"
              value={content.offer?.code ?? ""}
              onChange={(v) =>
                patch({
                  offer: { ...(content.offer ?? { title: "", text: "" }), code: v },
                })
              }
            />
          </Section>

          <Section title="Social links">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Shown in the header and footer. Only links you add appear.
            </p>
            <div className="space-y-2">
              {(content.socials ?? []).map((soc, i) => {
                const socials = content.socials ?? [];
                const upd = (u: Partial<SiteSocial>) =>
                  patch({
                    socials: socials.map((x, idx) =>
                      idx === i ? { ...x, ...u } : x,
                    ),
                  });
                return (
                  <div key={i} className="flex items-center gap-2">
                    <select
                      value={soc.platform}
                      onChange={(e) =>
                        upd({ platform: e.target.value as SocialPlatform })
                      }
                      className={cn("cursor-pointer appearance-none", fieldCls)}
                    >
                      <option value="facebook">Facebook</option>
                      <option value="instagram">Instagram</option>
                      <option value="tiktok">TikTok</option>
                      <option value="youtube">YouTube</option>
                      <option value="linkedin">LinkedIn</option>
                      <option value="whatsapp">WhatsApp</option>
                    </select>
                    <input
                      value={soc.url}
                      onChange={(e) => upd({ url: e.target.value })}
                      placeholder="https://…"
                      className={cn("flex-1", fieldCls)}
                    />
                    <button
                      onClick={() =>
                        patch({
                          socials: socials.filter((_, idx) => idx !== i),
                        })
                      }
                      className="rounded p-1 text-zinc-400 hover:text-red-600 dark:text-zinc-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
              <button
                onClick={() =>
                  patch({
                    socials: [
                      ...(content.socials ?? []),
                      { platform: "instagram", url: "" },
                    ],
                  })
                }
                className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
              >
                <Plus className="h-4 w-4" /> Add link
              </button>
            </div>
          </Section>

          {content.kind === "membership" ? (
            <Section title="Membership plans">
              <div className="space-y-3">
                {(content.membershipPlans ?? []).map((p, i) => {
                  const plans = content.membershipPlans ?? [];
                  const update = (u: Partial<MembershipPlan>) =>
                    setPlans(plans.map((x, idx) => (idx === i ? { ...x, ...u } : x)));
                  return (
                    <div
                      key={i}
                      className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          value={p.name}
                          onChange={(e) => update({ name: e.target.value })}
                          placeholder="Plan name"
                          className={cn("flex-1 font-medium", fieldCls)}
                        />
                        <button
                          onClick={() => setPlans(plans.filter((_, idx) => idx !== i))}
                          className="rounded p-1 text-zinc-400 hover:text-red-600 dark:text-zinc-500"
                          title="Remove plan"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <input
                          value={p.price}
                          onChange={(e) => update({ price: e.target.value })}
                          placeholder="29,90 €"
                          className={cn("w-28", fieldCls)}
                        />
                        <input
                          value={p.period}
                          onChange={(e) => update({ period: e.target.value })}
                          placeholder="/kk"
                          className={cn("w-20", fieldCls)}
                        />
                        <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300">
                          <input
                            type="checkbox"
                            checked={!!p.highlight}
                            onChange={(e) => update({ highlight: e.target.checked })}
                            className="h-3.5 w-3.5"
                          />
                          Featured
                        </label>
                      </div>
                      <div className="mt-2">
                        <ListEditor
                          label="Features"
                          items={p.features}
                          onChange={(features) => update({ features })}
                          placeholder="e.g. Kuntosalin vapaa käyttö"
                        />
                      </div>
                    </div>
                  );
                })}
                <button
                  onClick={() =>
                    setPlans([
                      ...(content.membershipPlans ?? []),
                      { name: "Uusi jäsenyys", price: "0 €", period: "/kk", features: [] },
                    ])
                  }
                  className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
                >
                  <Plus className="h-4 w-4" /> Add plan
                </button>
              </div>
            </Section>
          ) : null}

          <Section title="Trust stats">
            <div className="space-y-2">
              {(content.stats ?? []).map((st, i) => {
                const stats = content.stats ?? [];
                return (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      value={st.value}
                      onChange={(e) =>
                        patch({
                          stats: stats.map((x, idx) =>
                            idx === i ? { ...x, value: e.target.value } : x,
                          ),
                        })
                      }
                      placeholder="100 %"
                      className={cn("w-24", fieldCls)}
                    />
                    <input
                      value={st.label}
                      onChange={(e) =>
                        patch({
                          stats: stats.map((x, idx) =>
                            idx === i ? { ...x, label: e.target.value } : x,
                          ),
                        })
                      }
                      placeholder="e.g. Locally owned"
                      className={cn("flex-1", fieldCls)}
                    />
                    <button
                      onClick={() =>
                        patch({ stats: stats.filter((_, idx) => idx !== i) })
                      }
                      className="rounded p-1 text-zinc-400 hover:text-red-600 dark:text-zinc-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
              <button
                onClick={() =>
                  patch({
                    stats: [...(content.stats ?? []), { value: "", label: "" }],
                  })
                }
                className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
              >
                <Plus className="h-4 w-4" /> Add stat
              </button>
            </div>
          </Section>

          <Section title="FAQ">
            <div className="space-y-3">
              {(content.faq ?? []).map((f, i) => {
                const faq = content.faq ?? [];
                return (
                  <div
                    key={i}
                    className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        value={f.q}
                        onChange={(e) =>
                          patch({
                            faq: faq.map((x, idx) =>
                              idx === i ? { ...x, q: e.target.value } : x,
                            ),
                          })
                        }
                        placeholder="Question"
                        className={cn("flex-1 font-medium", fieldCls)}
                      />
                      <button
                        onClick={() =>
                          patch({ faq: faq.filter((_, idx) => idx !== i) })
                        }
                        className="rounded p-1 text-zinc-400 hover:text-red-600 dark:text-zinc-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <textarea
                      value={f.a}
                      onChange={(e) =>
                        patch({
                          faq: faq.map((x, idx) =>
                            idx === i ? { ...x, a: e.target.value } : x,
                          ),
                        })
                      }
                      placeholder="Answer"
                      rows={2}
                      className={cn("mt-2 w-full", fieldCls)}
                    />
                  </div>
                );
              })}
              <button
                onClick={() =>
                  patch({ faq: [...(content.faq ?? []), { q: "", a: "" }] })
                }
                className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
              >
                <Plus className="h-4 w-4" /> Add question
              </button>
            </div>
          </Section>

          <Section title="Contact">
            <Text label="Address" value={content.contact.address ?? ""} onChange={(v) => patchContact({ address: v, mapsQuery: v || content.businessName })} />
            <Text label="Phone" value={content.contact.phone ?? ""} onChange={(v) => patchContact({ phone: v })} />
            <Text label="Email" value={content.contact.email ?? ""} onChange={(v) => patchContact({ email: v })} />
            {content.contact.hours?.length ? (
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                Opening hours imported from Google: {content.contact.hours.length} day(s).
              </p>
            ) : null}
          </Section>
        </div>

        {/* Live preview */}
        <div className="lg:sticky lg:top-4 lg:h-[calc(100vh-7rem)]">
          <div className="h-[640px] overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 lg:h-full">
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

const SECTION_LABELS: Record<SectionId, string> = {
  stats: "Trust stats",
  about: "About",
  services: "Services",
  gallery: "Gallery",
  team: "Team",
  pricing: "Membership pricing",
  booking: "Booking form",
  offer: "Special offer",
  reviews: "Reviews",
  faq: "FAQ",
  cta: "Call to action",
};

/** Which sections currently have content worth showing in the manager. */
function presentSections(content: SiteContent): Set<SectionId> {
  const has = new Set<SectionId>();
  if ((content.stats ?? []).length) has.add("stats");
  if (content.about || (content.highlights ?? []).length) has.add("about");
  if ((content.services ?? []).length) has.add("services");
  if ((content.gallery ?? []).length) has.add("gallery");
  if ((content.team ?? []).length) has.add("team");
  if (content.kind === "membership" && (content.membershipPlans ?? []).length)
    has.add("pricing");
  if (content.kind === "booking") has.add("booking");
  if (content.offer?.title || content.offer?.text) has.add("offer");
  if ((content.reviews ?? []).length) has.add("reviews");
  if ((content.faq ?? []).length) has.add("faq");
  has.add("cta");
  return has;
}

function SectionManager({
  content,
  onChange,
}: {
  content: SiteContent;
  onChange: (p: Partial<SiteContent>) => void;
}) {
  const present = presentSections(content);
  const requested = content.sectionOrder ?? DEFAULT_SECTION_ORDER;
  const fullOrder: SectionId[] = [
    ...requested.filter((id) => DEFAULT_SECTION_ORDER.includes(id)),
    ...DEFAULT_SECTION_ORDER.filter((id) => !requested.includes(id)),
  ];
  const visibleOrder = fullOrder.filter((id) => present.has(id));
  const hidden = new Set(content.hiddenSections ?? []);

  function move(id: SectionId, dir: -1 | 1) {
    const pos = visibleOrder.indexOf(id);
    const target = pos + dir;
    if (target < 0 || target >= visibleOrder.length) return;
    const reordered = [...visibleOrder];
    [reordered[pos], reordered[target]] = [reordered[target], reordered[pos]];
    // Persist as a full order so hidden/absent sections keep their relative spot.
    const rest = fullOrder.filter((s) => !present.has(s));
    onChange({ sectionOrder: [...reordered, ...rest] });
  }

  function toggle(id: SectionId) {
    const next = new Set(hidden);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange({ hiddenSections: [...next] });
  }

  if (visibleOrder.length === 0)
    return (
      <p className="text-xs text-zinc-400 dark:text-zinc-500">
        Add content above to enable sections.
      </p>
    );

  return (
    <div className="space-y-1.5">
      {visibleOrder.map((id, i) => {
        const isHidden = hidden.has(id);
        return (
          <div
            key={id}
            className={cn(
              "flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 dark:border-zinc-800 dark:bg-zinc-950",
              isHidden && "opacity-50",
            )}
          >
            <span className="flex-1 text-sm text-zinc-700 dark:text-zinc-200">
              {SECTION_LABELS[id]}
            </span>
            <button
              onClick={() => move(id, -1)}
              disabled={i === 0}
              aria-label="Move up"
              className="rounded p-1 text-zinc-400 hover:text-zinc-800 disabled:opacity-30 dark:text-zinc-500 dark:hover:text-zinc-100"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
            <button
              onClick={() => move(id, 1)}
              disabled={i === visibleOrder.length - 1}
              aria-label="Move down"
              className="rounded p-1 text-zinc-400 hover:text-zinc-800 disabled:opacity-30 dark:text-zinc-500 dark:hover:text-zinc-100"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
            <button
              onClick={() => toggle(id)}
              aria-label={isHidden ? "Show section" : "Hide section"}
              className="rounded p-1 text-zinc-400 hover:text-indigo-600 dark:text-zinc-500 dark:hover:text-indigo-400"
            >
              {isHidden ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
      <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
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
      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">{label}</span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
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
      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">{label}</span>
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            value={item}
            onChange={(e) => onChange(items.map((x, idx) => (idx === i ? e.target.value : x)))}
            placeholder={placeholder}
            className="flex-1 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
          />
          <button
            onClick={() => onChange(items.filter((_, idx) => idx !== i))}
            className="rounded p-1 text-zinc-400 dark:text-zinc-500 hover:text-red-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange([...items, ""])}
        className="inline-flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800"
      >
        <Plus className="h-4 w-4" /> Add
      </button>
    </div>
  );
}
