"use client";

import { useState, useTransition } from "react";
import { Check, Download, Loader2 } from "lucide-react";
import { updateVideoScript } from "@/app/dashboard/videos/actions";
import { cn } from "@/lib/utils";

export type VideoItem = {
  id: string;
  hookLabel: string;
  script: string;
  status: string;
  signedUrl: string | null;
  durationSeconds: number | null;
  error: string | null;
};

const statusStyles: Record<string, string> = {
  draft: "bg-zinc-100 text-zinc-600",
  queued: "bg-amber-100 text-amber-700",
  rendering: "bg-amber-100 text-amber-700",
  ready: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
};

function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

export function VideoCard({
  video,
  index,
  editable,
}: {
  video: VideoItem;
  index: number;
  editable: boolean;
}) {
  const [script, setScript] = useState(video.script);
  const [saved, setSaved] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const words = wordCount(script);

  return (
    <div className="flex flex-col rounded-xl border border-zinc-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-500">
          #{index + 1} · {video.hookLabel || "Pitch"}
        </span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
            statusStyles[video.status] ?? statusStyles.draft,
          )}
        >
          {video.status}
        </span>
      </div>

      {video.status === "ready" && video.signedUrl ? (
        <div className="mt-3 space-y-2">
          <video
            controls
            preload="metadata"
            src={video.signedUrl}
            className="aspect-[9/16] w-full rounded-lg bg-zinc-950 object-contain"
          />
          <a
            href={video.signedUrl}
            download
            className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            <Download className="h-4 w-4" /> Download MP4
            {video.durationSeconds ? (
              <span className="text-zinc-400">· {video.durationSeconds}s</span>
            ) : null}
          </a>
        </div>
      ) : video.status === "queued" || video.status === "rendering" ? (
        <div className="mt-3 grid aspect-[9/16] w-full place-items-center rounded-lg bg-zinc-50">
          <div className="text-center">
            <Loader2 className="mx-auto h-5 w-5 animate-spin text-zinc-400" />
            <p className="mt-2 text-xs text-zinc-500">Rendering…</p>
          </div>
        </div>
      ) : null}

      {video.status === "failed" && video.error ? (
        <p className="mt-3 rounded-lg bg-red-50 p-2.5 text-xs text-red-700">{video.error}</p>
      ) : null}

      <div className="mt-3 flex-1">
        {editable ? (
          <>
            <textarea
              value={script}
              onChange={(e) => {
                setScript(e.target.value);
                setSaved(false);
              }}
              rows={6}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
            <div className="mt-1.5 flex items-center justify-between">
              <span
                className={cn(
                  "text-xs",
                  words > 90 ? "text-amber-600" : "text-zinc-400",
                )}
              >
                {words} words ≈ {Math.round(words / 2.4)}s
                {words > 90 ? " — long for a 30s video" : ""}
              </span>
              {saved ? (
                <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
                  <Check className="h-3 w-3" /> Saved
                </span>
              ) : (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      setError(null);
                      const res = await updateVideoScript(video.id, script);
                      if (res.error) setError(res.error);
                      else setSaved(true);
                    })
                  }
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-500 disabled:opacity-60"
                >
                  {pending ? "Saving…" : "Save script"}
                </button>
              )}
            </div>
          </>
        ) : (
          <p className="text-sm leading-relaxed text-zinc-600">{script}</p>
        )}
        {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
      </div>
    </div>
  );
}
