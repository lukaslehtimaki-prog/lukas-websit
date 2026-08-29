import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/signup-form";

const signupDescription =
  "Create your Sitagio workspace and start finding local businesses with no website, then build each one a ready-to-launch AI site. First week free.";

export const metadata: Metadata = {
  title: "Create account · Sitagio",
  description: signupDescription,
  alternates: { canonical: "/signup" },
  openGraph: {
    title: "Create your Sitagio workspace",
    description: signupDescription,
    url: "/signup",
  },
};

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
