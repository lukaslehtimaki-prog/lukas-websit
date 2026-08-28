import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Sign in · Sitagio" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const { redirectTo } = await searchParams;
  const whopEnabled = process.env.NEXT_PUBLIC_ENABLE_WHOP_AUTH === "true";
  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-zinc-900">Welcome back</h1>
      <p className="mb-6 text-sm text-zinc-500">Sign in to your workspace.</p>
      {whopEnabled && (
        <div className="mb-6">
          {/* Buyers arrive from Whop already paid. Signing in with Whop keeps the
              email identical to the one they purchased with — otherwise they create
              a second account and silently lose the plan they bought. */}
          <a
            href="/api/auth/whop/start"
            className="flex w-full items-center justify-center rounded-lg bg-[#FA4616] py-2.5 font-medium text-white transition hover:opacity-90"
          >
            Continue with Whop
          </a>
          <p className="mt-2 text-center text-xs text-zinc-500">
            Bought on Whop? Use this — it keeps your plan on the same account.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-200" />
            <span className="text-xs text-zinc-400">or with email</span>
            <div className="h-px flex-1 bg-zinc-200" />
          </div>
        </div>
      )}
      <LoginForm redirectTo={redirectTo} />
    </div>
  );
}
