import "server-only";
import type { VideoProvider } from "./provider";

// Demo-mode provider used when HEYGEN_API_KEY is unset: renders "complete" ~20s after
// creation and returns a stable public sample MP4. Stateless — the job id encodes its
// creation time, so status survives server restarts and exercises the exact same
// queued → rendering → download-to-storage path as the real provider, for free.

const RENDER_SECONDS = 20;
const SAMPLE_MP4 =
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4";

export const mockProvider: VideoProvider = {
  id: "mock",

  async createVideo() {
    return { jobId: `mock_${Date.now()}` };
  },

  async getStatus(jobId) {
    const startedAt = Number(jobId.replace("mock_", ""));
    if (!Number.isFinite(startedAt)) {
      return { status: "failed", error: "Unknown mock job id." };
    }
    if (Date.now() - startedAt < RENDER_SECONDS * 1000) {
      return { status: "processing" };
    }
    return { status: "completed", videoUrl: SAMPLE_MP4, durationSeconds: 15 };
  },

  estimateCostCents() {
    return 0;
  },
};
