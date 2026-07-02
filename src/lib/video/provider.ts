import "server-only";
import { isHeyGenConfigured } from "@/lib/env";
import { heygenProvider } from "./heygen";
import { mockProvider } from "./mock";

// Thin abstraction over talking-avatar video generation so additional providers
// (fal.ai Kling, Higgsfield, …) can slot in later without touching the actions.

export type CreateVideoInput = {
  script: string;
  avatarId: string;
  voiceId: string;
  title: string;
};

export type ProviderJobStatus = {
  status: "processing" | "completed" | "failed";
  /** Short-lived provider URL — download into our own storage, never persist as-is. */
  videoUrl?: string;
  durationSeconds?: number;
  error?: string;
};

export type VideoProvider = {
  id: "heygen" | "mock";
  createVideo(input: CreateVideoInput): Promise<{ jobId: string }>;
  getStatus(jobId: string): Promise<ProviderJobStatus>;
  /** Rough cost of a finished video, for the videos.cost_cents column. */
  estimateCostCents(durationSeconds: number): number;
};

/** HeyGen when a key is configured; otherwise the free demo-mode mock. */
export function getVideoProvider(): VideoProvider {
  return isHeyGenConfigured() ? heygenProvider : mockProvider;
}

/** Resolve the provider a video row was queued with (its jobs must finish on it). */
export function providerFor(id: string): VideoProvider {
  return id === "heygen" ? heygenProvider : mockProvider;
}

export function isDemoMode(): boolean {
  return !isHeyGenConfigured();
}
