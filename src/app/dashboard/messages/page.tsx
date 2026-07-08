import { Inbox, CalendarClock, Mail } from "lucide-react";
import { requireTenantContext } from "@/lib/auth/tenant";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata = { title: "Messages · Sitovai" };
export const dynamic = "force-dynamic";

type MessageRow = {
  id: string;
  kind: "contact" | "booking";
  name: string;
  email: string | null;
  phone: string | null;
  service: string | null;
  preferred_time: string | null;
  message: string | null;
  forwarded: boolean;
  created_at: string;
  site: { title: string } | { title: string }[] | null;
};

export default async function MessagesPage() {
  await requireTenantContext();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_messages")
    .select(
      "id,kind,name,email,phone,service,preferred_time,message,forwarded,created_at,site:sites(title)",
    )
    .order("created_at", { ascending: false })
    .limit(200);
  const messages = (data ?? []) as unknown as MessageRow[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Messages
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Contact and booking submissions from your published websites. Each is
          also forwarded by email to the business it belongs to.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          The message inbox needs a one-time database setup: run{" "}
          <code className="font-mono">supabase/migrations/0004_site_messages.sql</code>{" "}
          in the Supabase SQL editor. Until then, form submissions are still
          forwarded to the business by email — nothing is lost.
        </div>
      ) : messages.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-10 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Inbox className="h-6 w-6" />
          </div>
          <p className="mt-4 font-medium text-zinc-900 dark:text-zinc-100">
            No messages yet
          </p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            When someone uses a contact or booking form on a published site, it
            shows up here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => {
            const site = Array.isArray(m.site) ? m.site[0] : m.site;
            return (
              <div
                key={m.id}
                className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                      m.kind === "booking"
                        ? "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"
                        : "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
                    )}
                  >
                    {m.kind === "booking" ? (
                      <CalendarClock className="h-3 w-3" />
                    ) : (
                      <Mail className="h-3 w-3" />
                    )}
                    {m.kind === "booking" ? "Booking" : "Contact"}
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {m.name}
                  </span>
                  {site?.title ? (
                    <span className="text-zinc-400 dark:text-zinc-500">
                      · {site.title}
                    </span>
                  ) : null}
                  <span className="ml-auto text-xs text-zinc-400 dark:text-zinc-500">
                    {new Date(m.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {m.email ? (
                    <a
                      href={`mailto:${m.email}`}
                      className="text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      {m.email}
                    </a>
                  ) : null}
                  {m.phone ? <span>{m.phone}</span> : null}
                  {m.service ? <span>Service: {m.service}</span> : null}
                  {m.preferred_time ? <span>Time: {m.preferred_time}</span> : null}
                  {!m.forwarded ? (
                    <span className="text-amber-600 dark:text-amber-400">
                      Not forwarded (business has no email on file)
                    </span>
                  ) : null}
                </div>
                {m.message ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                    {m.message}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
