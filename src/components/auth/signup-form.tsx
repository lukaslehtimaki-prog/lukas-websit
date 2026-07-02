"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUpAction, type AuthState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";

const initial: AuthState = {};

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signUpAction, initial);

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Your name" name="fullName" autoComplete="name" />
      <Field
        label="Workspace / company name"
        name="companyName"
        placeholder="e.g. Acme Agency"
      />
      <Field label="Email" name="email" type="email" autoComplete="email" required />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
      />
      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state.message ? (
        <p className="text-sm text-emerald-600">{state.message}</p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creating account…" : "Create account"}
      </Button>
      <p className="text-center text-sm text-zinc-500">
        Already have an account?{" "}
        <Link href="/login" className="text-indigo-600 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
