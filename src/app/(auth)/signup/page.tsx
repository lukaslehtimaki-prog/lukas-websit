import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = { title: "Create account · Sitexa" };

export default function SignupPage() {
  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-zinc-900">
        Create your workspace
      </h1>
      <p className="mb-6 text-sm text-zinc-500">
        Start finding local businesses without a website.
      </p>
      <SignupForm />
    </div>
  );
}
