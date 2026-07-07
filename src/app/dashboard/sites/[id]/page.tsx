import { notFound } from "next/navigation";
import { requireTenantContext } from "@/lib/auth/tenant";
import { createClient } from "@/lib/supabase/server";
import { isAIConfigured, isResendConfigured } from "@/lib/env";
import { SiteEditor } from "@/components/sites/site-editor";
import type { SiteContent } from "@/lib/templates/types";

export const metadata = { title: "Edit website · Sitovai" };

export default async function SiteEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireTenantContext();
  const { id } = await params;

  const supabase = await createClient();
  const { data: site } = await supabase
    .from("sites")
    .select("id,title,template_id,status,content")
    .eq("id", id)
    .maybeSingle();

  if (!site) notFound();

  const s = site as unknown as {
    id: string;
    template_id: string;
    status: string;
    content: SiteContent;
  };

  return (
    <SiteEditor
      siteId={s.id}
      initialTemplateId={s.template_id}
      initialStatus={s.status}
      initialContent={s.content}
      aiEnabled={isAIConfigured()}
      emailEnabled={isResendConfigured()}
    />
  );
}
