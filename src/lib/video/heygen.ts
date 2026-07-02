import "server-only";
import { env } from "@/lib/env";
import type { VideoProvider } from "./provider";

// HeyGen v2 API client (pay-as-you-go). Standard avatar generation ≈ $1 per minute
// of output. Docs: https://developers.heygen.com
//
// Output is 720×1280 (9:16) — the short-form social format this product targets.

const HEYGEN_BASE = "https://api.heygen.com";

export class HeyGenError extends Error {}

async function heygenFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${HEYGEN_BASE}${path}`, {
    ...init,
    headers: {
      "X-Api-Key": env.HEYGEN_API_KEY,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  const body = (await res.json().catch(() => ({}))) as {
    data?: unknown;
    error?: { message?: string } | string | null;
    message?: string;
  };
  if (!res.ok) {
    const detail =
      typeof body.error === "string"
        ? body.error
        : (body.error?.message ?? body.message ?? `HTTP ${res.status}`);
    throw new HeyGenError(`HeyGen ${path}: ${detail}`);
  }
  return body.data as T;
}

export const heygenProvider: VideoProvider = {
  id: "heygen",

  async createVideo({ script, avatarId, voiceId, title }) {
    const data = await heygenFetch<{ video_id?: string }>("/v2/video/generate", {
      method: "POST",
      body: JSON.stringify({
        title,
        video_inputs: [
          {
            character: { type: "avatar", avatar_id: avatarId, avatar_style: "normal" },
            voice: { type: "text", input_text: script, voice_id: voiceId },
          },
        ],
        dimension: { width: 720, height: 1280 },
      }),
    });
    if (!data?.video_id) throw new HeyGenError("HeyGen did not return a video_id.");
    return { jobId: data.video_id };
  },

  async getStatus(jobId) {
    const data = await heygenFetch<{
      status?: string;
      video_url?: string;
      duration?: number;
      error?: { message?: string } | null;
    }>(`/v1/video_status.get?video_id=${encodeURIComponent(jobId)}`);

    switch (data?.status) {
      case "completed":
        return {
          status: "completed",
          videoUrl: data.video_url,
          durationSeconds: data.duration ? Math.round(data.duration) : undefined,
        };
      case "failed":
        return {
          status: "failed",
          error: data.error?.message ?? "HeyGen render failed.",
        };
      default: // 'processing' | 'pending' | 'waiting'
        return { status: "processing" };
    }
  },

  // Standard generation ≈ $1/min → 100 cents per 60s.
  estimateCostCents(durationSeconds) {
    return Math.ceil((durationSeconds / 60) * 100);
  },
};
