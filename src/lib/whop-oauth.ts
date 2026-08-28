import crypto from "node:crypto";
import { env } from "@/lib/env";

/**
 * "Sign in with Whop" — OAuth 2.1 + PKCE (public client, no client secret).
 *
 * Why this exists: buyers arrive from Whop having already paid. Asking them to
 * remember which email they used and type it again is where paying customers get
 * silently lost — they sign up with a different address and land on the free tier.
 * Signing in with Whop removes the mismatch entirely: the email comes from Whop.
 */

export const WHOP_AUTHORIZE_URL = "https://api.whop.com/oauth/authorize";
export const WHOP_TOKEN_URL = "https://api.whop.com/oauth/token";
export const WHOP_USERINFO_URL = "https://api.whop.com/oauth/userinfo";

/** openid is required for the id_token; profile/email give us name + address. */
export const WHOP_SCOPES = "openid profile email";

function b64url(buf: Buffer): string {
  return buf.toString("base64url");
}

export function randomToken(bytes = 32): string {
  return b64url(crypto.randomBytes(bytes));
}

/** PKCE S256: challenge = base64url(sha256(verifier)). */
export function codeChallengeFor(verifier: string): string {
  return b64url(crypto.createHash("sha256").update(verifier).digest());
}

export function isWhopOAuthConfigured(): boolean {
  return Boolean(env.WHOP_APP_ID && env.WHOP_OAUTH_REDIRECT_URI);
}

export function buildAuthorizeUrl(opts: {
  state: string;
  nonce: string;
  codeChallenge: string;
}): string {
  const p = new URLSearchParams({
    response_type: "code",
    client_id: env.WHOP_APP_ID,
    redirect_uri: env.WHOP_OAUTH_REDIRECT_URI,
    scope: WHOP_SCOPES,
    state: opts.state,
    nonce: opts.nonce, // required whenever openid is requested
    code_challenge: opts.codeChallenge,
    code_challenge_method: "S256",
  });
  return `${WHOP_AUTHORIZE_URL}?${p.toString()}`;
}

export interface WhopUserInfo {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  preferred_username?: string;
  picture?: string;
}

/** Exchange the authorization code. Public client: PKCE verifier, no secret. */
export async function exchangeCode(code: string, codeVerifier: string): Promise<string> {
  const res = await fetch(WHOP_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: env.WHOP_OAUTH_REDIRECT_URI,
      client_id: env.WHOP_APP_ID,
      code_verifier: codeVerifier,
    }),
  });
  if (!res.ok) {
    throw new Error(`whop token exchange failed: ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) throw new Error("whop token exchange returned no access_token");
  return json.access_token;
}

export async function fetchUserInfo(accessToken: string): Promise<WhopUserInfo> {
  const res = await fetch(WHOP_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`whop userinfo failed: ${res.status}`);
  return (await res.json()) as WhopUserInfo;
}
