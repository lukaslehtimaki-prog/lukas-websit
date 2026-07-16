"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signInAction, type AuthState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { PasswordField } from "@/components/ui/password-field";

const initial: AuthState = {};

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [state, formAction, pending] = useActionState(signInAction, initial);

  return (
    <form action={formAction} className="space-y-4">
      {redirectTo ? (
        <input type="hidden" name="redirectTo" value={redirectTo} />
      ) : null}
      <Field label="Email" name="email" type="email" autoComplete="email" required />
      <PasswordField
        label="Password"
        name="password"
        autoComplete="current-password"
        required
      />
      {state.error ? (
        <p className="text-sm text-red-600" aria-live="polite">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      <div className="flex justify-between text-sm text-zinc-500">
        <Link href="/forgot-password" className="hover:text-zinc-800">
          Forgot password?
        </Link>
        <Link href="/signup" className="hover:text-zinc-800">
          Create account
        </Link>
      </div>
    </form>
  );
}
