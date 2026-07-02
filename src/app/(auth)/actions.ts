"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

export type AuthState = { error?: string; message?: string };

const NOT_CONFIGURED: AuthState = {
  error:
    "Supabase isn't configured yet. Add your keys to .env.local — see README.md → Setup.",
};

function field(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

async function siteOrigin(): Promise<string> {
  const h = await headers();
  return h.get("origin") ?? `https://${h.get("host") ?? "localhost:3000"}`;
}

export async function signInAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;

  const email = field(formData, "email");
  const password = String(formData.get("password") ?? "");
  const requested = field(formData, "redirectTo");
  const redirectTo = requested.startsWith("/") ? requested : "/dashboard";
  if (!email || !password) return { error: "Enter your email and password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect(redirectTo);
}

export async function signUpAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;

  const email = field(formData, "email");
  const password = String(formData.get("password") ?? "");
  const fullName = field(formData, "fullName");
  const companyName = field(formData, "companyName");
  if (!email || !password) return { error: "Enter your email and a password." };
  if (password.length < 8)
    return { error: "Password must be at least 8 characters." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Consumed by the handle_new_user() trigger to name the new tenant/profile.
      data: { full_name: fullName, company_name: companyName },
      emailRedirectTo: `${await siteOrigin()}/auth/callback`,
    },
  });
  if (error) return { error: error.message };

  if (!data.session) {
    return { message: "Check your email to confirm your account, then sign in." };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function requestPasswordResetAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;

  const email = field(formData, "email");
  if (!email) return { error: "Enter your email." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await siteOrigin()}/auth/callback?next=/reset-password`,
  });
  if (error) return { error: error.message };

  return {
    message: "If an account exists for that email, a reset link is on its way.",
  };
}

export async function updatePasswordAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;

  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");
  if (password.length < 8)
    return { error: "Password must be at least 8 characters." };
  if (password !== confirm) return { error: "Passwords don't match." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signOutAction(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  revalidatePath("/", "layout");
  redirect("/login");
}
