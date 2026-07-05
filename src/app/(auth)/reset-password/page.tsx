import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = { title: "Set new password · Sitovai" };

export default function ResetPasswordPage() {
  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-zinc-900">
        Set a new password
      </h1>
      <p className="mb-6 text-sm text-zinc-500">
        Choose a new password for your account.
      </p>
      <ResetPasswordForm />
    </div>
  );
}
