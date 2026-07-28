"use server";

import { requireTenantContext } from "@/lib/auth/tenant";
import { createClient } from "@/lib/supabase/server";

export type PaletteResults = {
  sites: { id: string; title: string; status: string }[];
  leads: { id: string; name: string; category: string | null }[];
};

/** Fuzzy-ish search over the tenant's own sites and leads for the ⌘K palette. */
export async function paletteSearchAction(
  query: string,
): Promise<PaletteResults> {
  await requireTenantContext();
  const q = query.trim().slice(0, 80);
  if (q.length < 2) return { sites: [], leads: [] };

  const supabase = await createClient();
  const like = `%${q.replace(/[%_]/g, "")}%`;
  const [{ data: sites }, { data: leads }] = await Promise.all([
    supabase
      .from("sites")
      .select("id, title, status")
      .ilike("title", like)
      .order("updated_at", { ascending: false })
      .limit(6),
    supabase
      .from("leads")
      .select("id, name, category")
      .ilike("name", like)
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  return {
    sites: (sites ?? []) as PaletteResults["sites"],
    leads: (leads ?? []) as PaletteResults["leads"],
  };
}
