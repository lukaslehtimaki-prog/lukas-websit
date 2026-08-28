import { NextResponse } from "next/server";
import {
  buildAuthorizeUrl,
  codeChallengeFor,
  isWhopOAuthConfigured,
  randomToken,
} from "@/lib/whop-oauth";

export const runtime = "nodejs";

/** Kicks off "Sign in with Whop". PKCE state lives in short-lived httpOnly cookies. */
export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  if (!isWhopOAuthConfigured()) {
    return NextResponse.redirect(`${origin}/login?error=whop_not_configured`);
  }

  const state = randomToken(24);
  const nonce = randomToken(24);
  const verifier = randomToken(32);

  const res = NextResponse.redirect(
    buildAuthorizeUrl({ state, nonce, codeChallenge: codeChallengeFor(verifier) }),
  );
  const opts = { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/", maxAge: 600 };
  res.cookies.set("whop_state", state, opts);
  res.cookies.set("whop_nonce", nonce, opts);
  res.cookies.set("whop_verifier", verifier, opts);
  return res;
}
