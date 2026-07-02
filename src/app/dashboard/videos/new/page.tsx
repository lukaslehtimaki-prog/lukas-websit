import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireTenantContext } from "@/lib/auth/tenant";
import { NewVideoWizard } from "@/components/videos/new-video-wizard";

export const metadata = { title: "New video series · Sitexa" };

export default async function NewVideoPage() {
  await requireTenantContext();

  return (
    <div className="max-w-3xl space-y-6">
      <Link
        href="/dashboard/videos"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800"
      >
        <ArrowLeft className="h-4 w-4" /> Back to videos
      </Link>
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Create a video series</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Tell us about the product, pick a spokesperson and tone, and AI writes the sales
          scripts — you review them before anything renders.
        </p>
      </div>
      <NewVideoWizard />
    </div>
  );
}
