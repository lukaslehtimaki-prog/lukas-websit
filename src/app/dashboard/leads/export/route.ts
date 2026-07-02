import { createClient } from "@/lib/supabase/server";

const COLUMNS = [
  "name",
  "address",
  "phone",
  "category",
  "website",
  "website_status",
  "business_id",
  "registry_status",
  "registry_registration_date",
  "registry_industry_code",
  "crm_status",
  "created_at",
];

function csvEscape(value: unknown): string {
  const s = value == null ? "" : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  // RLS scopes this to the caller's tenant automatically.
  const { data } = await supabase
    .from("leads")
    .select(COLUMNS.join(","))
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as unknown as Record<string, unknown>[];
  const csv = [
    COLUMNS.join(","),
    ...rows.map((r) => COLUMNS.map((c) => csvEscape(r[c])).join(",")),
  ].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
