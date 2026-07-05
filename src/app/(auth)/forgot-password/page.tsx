import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = { title: "Forgot password · Sitovai" };

export default function ForgotPasswordPage() {
  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-zinc-900">
        Reset your password
      </h1>
      <p className="mb-6 text-sm text-zinc-500">
        We will email you a link to set a new password.
      </p>
      <ForgotPasswordForm />
    </div>
  );
}
