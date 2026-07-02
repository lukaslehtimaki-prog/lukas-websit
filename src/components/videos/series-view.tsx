"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Clapperboard, Loader2, RefreshCw, Trash2 } from "lucide-react";
import {
  startRenderAction,
  pollSeriesAction,
  regenerateScriptsAction,
  deleteSeriesAction,
} from "@/app/dashboard/videos/actions";
import { VideoCard, type VideoItem } from "./video-card";
import { Button } from "@/components/ui/button";

const POLL_MS = 9000;

export function SeriesView({
  seriesId,
  initialStatus,
  initialVideos,
  demoMode,
}: {
  seriesId: string;
  initialStatus: string;
  initialVideos: VideoItem[];
  demoMode: boolean;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [videos, setVideos] = useState(initialVideos);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const inFlight = videos.some((v) => v.status === "queued" || v.status === "rendering");

  const poll = useCallback(() => {
    startTransition(async () => {
      const snapshot = await pollSeriesAction(seriesId);
      if (snapshot) {
        setStatus(snapshot.seriesStatus);
        setVideos(snapshot.videos);
      }
    });
  }, [seriesId]);

  // Reconcile on mount (heals renders finished while the tab was closed), then keep
  // polling only while something is actually rendering.
  useEffect(() => {
    if (status !== "draft") poll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (inFlight && !pollTimer.current) {
      pollTimer.current = setInterval(poll, POLL_MS);
    }
    if (!inFlight && pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
    return () => {
      if (pollTimer.current) {
        clearInterval(pollTimer.current);
        pollTimer.current = null;
      }
    };
  }, [inFlight, poll]);

  const isDraft = status === "draft";
  const draftCount = videos.filter((v) => v.status === "draft").length;

  return (
    <div className="space-y-6">
      {isDraft ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-indigo-900">
              Review the scripts, then render
            </p>
            <p className="mt-0.5 text-xs text-indigo-700">
              Edit any script below.{" "}
              {demoMode
                ? "Demo mode: rendering returns sample clips and costs nothing."
                : `Rendering ${draftCount} video${draftCount === 1 ? "" : "s"} uses ${draftCount} of your monthly video generations.`}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                setError(null);
                const res = await regenerateScriptsAction(seriesId);
                if (res.error) setError(res.error);
                else window.location.reload();
              })
            }
          >
            <RefreshCw className="h-4 w-4" /> New scripts
          </Button>
          <Button
            variant="accent"
            size="sm"
            disabled={pending || draftCount === 0}
            onClick={() =>
              startTransition(async () => {
                setError(null);
                const res = await startRenderAction(seriesId);
                if (res.error) setError(res.error);
                else poll();
              })
            }
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Clapperboard className="h-4 w-4" />
            )}
            Render {draftCount} video{draftCount === 1 ? "" : "s"}
          </Button>
        </div>
      ) : inFlight ? (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
          Rendering — this usually takes a couple of minutes. You can leave this page; we
          keep going in the background.
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((v, i) => (
          <VideoCard key={v.id} video={v} index={i} editable={isDraft} />
        ))}
      </div>

      <div className="border-t border-zinc-200 pt-4">
        <Button
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() => {
            if (confirm("Delete this series and its videos? This can't be undone.")) {
              startTransition(async () => {
                await deleteSeriesAction(seriesId);
              });
            }
          }}
          className="text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" /> Delete series
        </Button>
      </div>
    </div>
  );
}
