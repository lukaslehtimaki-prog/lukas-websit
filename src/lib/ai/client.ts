import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { env, isAIConfigured } from "@/lib/env";

let _client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (!isAIConfigured()) {
    throw new Error("ANTHROPIC_API_KEY is not set (see README → Setup).");
  }
  if (!_client) {
    _client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }
  return _client;
}

export { isAIConfigured };
