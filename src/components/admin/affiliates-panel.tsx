"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, Loader2, Plus, UserPlus } from "lucide-react";
import {
  createAffiliateAction,
  setAffiliateActiveAction,
} from "@/app/dashboard/admin/actions";
import { cn } from "@/lib/utils";

const fieldCls =
  "rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500";

export type AffiliateRow = {
  id: string;
  code: string;
  name: string;
  email: string | null;
  commission_bps: number;
  clicks: number;
  active: boolean;
  signups: number;
  paying: number;
  trialing: number;
  monthlyCommissionCents: number;
};

export function AffiliatesPanel({
  affiliates,
  baseUrl,
}: {
  affiliates: AffiliateRow[];
  baseUrl: string;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [pct, setPct] = useState("20");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function suggestCode(n: string) {
    return n
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 20);
  }

  function create() {
    setMessage(null);
    startTransition(async () => {
      const r = await createAffiliateAction({
        name,
        code,
        email,
        commissionPct: Number(pct) || 20,
      });
      if (r.error) {
        setMessage(r.error);
      } else {
        setName("");
        setCode("");
        setEmail("");
        setShowForm(false);
        setMessage("Affiliate created ✓");
        router.refresh();
      }
    });
  }

  function toggle(id: string, active: boolean) {
    startTransition(async () => {
      const r = await setAffiliateActiveAction(id, active);
      if (r.error) setMessage(r.error);
      else router.refresh();
    });
  }

  function copyLink(code: string) {
    navigator.clipboard?.writeText(`${baseUrl}/?ref=${code}`);
    setMessage("Link copied ✓");
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Affiliates
        </h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-500"
        >
          <UserPlus className="h-4 w-4" /> New affiliate
        </button>
        {message ? (
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {message}
          </span>
        ) : null}
      </div>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Share links like{" "}
        <code className="font-mono text-xs">{baseUrl}/?ref=code</code> — sign-ups
        through them get 10% off every invoice, and the affiliate earns their
        commission share of referred revenue (paid out manually).
      </p>

      {showForm ? (
        <div className="flex flex-wrap items-end gap-2 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <label className="grid gap-1 text-xs text-zinc-500 dark:text-zinc-400">
            Name
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!code) setCode(suggestCode(e.target.value));
              }}
              placeholder="Matti Meikäläinen"
              className={cn("w-44", fieldCls)}
            />
          </label>
          <label className="grid gap-1 text-xs text-zinc-500 dark:text-zinc-400">
            Code (the link)
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toLowerCase())}
              placeholder="matti"
              className={cn("w-36 font-mono", fieldCls)}
            />
          </label>
          <label className="grid gap-1 text-xs text-zinc-500 dark:text-zinc-400">
            Email (optional)
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="matti@example.com"
              type="email"
              className={cn("w-52", fieldCls)}
            />
          </label>
          <label className="grid gap-1 text-xs text-zinc-500 dark:text-zinc-400">
            Commission %
            <input
              value={pct}
              onChange={(e) => setPct(e.target.value)}
              type="number"
              min={0}
              max={90}
              className={cn("w-20", fieldCls)}
            />
          </label>
          <button
            onClick={create}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Create
          </button>
        </div>
      ) : null}

      {affiliates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
          No affiliates yet — create the first one and share their link.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3">Affiliate</th>
                <th className="px-4 py-3">Link</th>
                <th className="px-4 py-3">Clicks</th>
                <th className="px-4 py-3">Sign-ups</th>
                <th className="px-4 py-3">Paying</th>
                <th className="px-4 py-3">Commission ≈/mo</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {affiliates.map((a) => (
                <tr key={a.id} className={a.active ? "" : "opacity-50"}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {a.name}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {a.email ?? "—"} · {a.commission_bps / 100}%
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => copyLink(a.code)}
                      className="inline-flex items-center gap-1.5 font-mono text-xs text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      /?ref={a.code} <Copy className="h-3 w-3" />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                    {a.clicks}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                    {a.signups}
                    {a.trialing ? (
                      <span className="ml-1 text-xs text-zinc-400">
                        ({a.trialing} trialing)
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                    {a.paying}
                  </td>
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                    €{(a.monthlyCommissionCents / 100).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggle(a.id, !a.active)}
                      disabled={isPending}
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-medium transition",
                        a.active
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300"
                          : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400",
                      )}
                    >
                      {a.active ? "Active" : "Disabled"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
