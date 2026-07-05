import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Sign in · Sitovai" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const { redirectTo } = await searchParams;
  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-zinc-900">Welcome back</h1>
      <p className="mb-6 text-sm text-zinc-500">Sign in to your workspace.</p>
      <LoginForm redirectTo={redirectTo} />
    </div>
  );
}
