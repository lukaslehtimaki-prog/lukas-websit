"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, KeyRound } from "lucide-react";
import {
  updateAccountAction,
  sendPasswordResetAction,
} from "@/app/dashboard/settings/actions";
import { cn } from "@/lib/utils";

const fieldCls =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500";

export function AccountForm({
  email,
  workspaceName,
  fullName,
  planLabel,
  canRename,
}: {
  email: string;
  workspaceName: string;
  fullName: string;
  planLabel: string;
  canRename: boolean;
}) {
  const router = useRouter();
  const [ws, setWs] = useState(workspaceName);
  const [name, setName] = useState(fullName);
  const [message, setMessage] = useState<string | null>(null);
  const [resetMsg, setResetMsg] = useState<string | null>(null);
  const [saving, startSave] = useTransition();
  const [resetting, startReset] = useTransition();

  const dirty = ws.trim() !== workspaceName || name.trim() !== fullName;

  function save() {
    setMessage(null);
    startSave(async () => {
      const r = await updateAccountAction({ workspaceName: ws, fullName: name });
      if (r.error) setMessage(r.error);
      else {
        setMessage("Saved ✓");
        router.refresh();
      }
    });
  }

  function resetPassword() {
    setResetMsg(null);
    startReset(async () => {
      const r = await sendPasswordResetAction();
      setResetMsg(
        r.error ?? "Password reset link sent — check your inbox.",
      );
    });
  }

  return (
    <div className="space-y-4">
      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
          Business / workspace name
        </span>
        <input
          value={ws}
          onChange={(e) => setWs(e.target.value)}
          disabled={!canRename}
          className={cn(fieldCls, !canRename && "opacity-60")}
        />
        {!canRename ? (
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            Only workspace owners can change this.
          </span>
        ) : (
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            Used across your dashboard and as the sign-off on pitch emails.
          </span>
        )}
      </label>

      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
          Your name
        </span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Lukas Lehtimäki"
          className={fieldCls}
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Email</p>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {email}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Plan</p>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {planLabel}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          onClick={save}
          disabled={!dirty || saving}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          Save changes
        </button>
        <button
          onClick={resetPassword}
          disabled={resetting}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          {resetting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <KeyRound className="h-4 w-4" />
          )}
          Change password
        </button>
        {message ? (
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {message}
          </span>
        ) : null}
        {resetMsg ? (
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {resetMsg}
          </span>
        ) : null}
      </div>
    </div>
  );
}
