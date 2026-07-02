"use client";

import { useActionState, useState } from "react";
import { Loader2, Wand2 } from "lucide-react";
import {
  createVideoSeriesAction,
  type NewSeriesState,
} from "@/app/dashboard/videos/actions";
import { AVATAR_PRESETS, TONES } from "@/lib/video/avatars";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

export function NewVideoWizard() {
  const [avatarKey, setAvatarKey] = useState<string>(AVATAR_PRESETS[0].key);
  const [tone, setTone] = useState<string>(TONES[0].id);
  const [count, setCount] = useState(3);
  const [state, formAction, pending] = useActionState(
    createVideoSeriesAction,
    {} as NewSeriesState,
  );

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="avatarKey" value={avatarKey} />
      <input type="hidden" name="tone" value={tone} />
      <input type="hidden" name="count" value={count} />

      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <p className="mb-3 text-sm font-medium text-zinc-700">1. The product</p>
        <div className="space-y-3">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-zinc-600">Product or service name</span>
            <input
              name="name"
              required
              placeholder="e.g. GlowDrop vitamin serum"
              className={inputClass}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-zinc-600">
              What is it and who is it for?
            </span>
            <textarea
              name="description"
              required
              rows={3}
              placeholder="A lightweight vitamin C serum that brightens dull skin in two weeks — for people who want results without a 10-step routine."
              className={inputClass}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-zinc-600">
              Key selling points <span className="text-zinc-400">(one per line, optional)</span>
            </span>
            <textarea
              name="sellingPoints"
              rows={3}
              placeholder={"Visible results in 14 days\nDermatologist tested\nFree shipping over €30"}
              className={inputClass}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-zinc-600">
              Product image URL <span className="text-zinc-400">(optional)</span>
            </span>
            <input
              name="imageUrl"
              type="url"
              placeholder="https://…"
              className={inputClass}
            />
          </label>
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-zinc-700">2. Pick a spokesperson</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {AVATAR_PRESETS.map((a) => (
            <button
              key={a.key}
              type="button"
              onClick={() => setAvatarKey(a.key)}
              className={cn(
                "rounded-xl border p-4 text-left transition",
                avatarKey === a.key
                  ? "border-indigo-500 ring-2 ring-indigo-100"
                  : "border-zinc-200 hover:border-zinc-300",
              )}
            >
              <span
                className={cn(
                  "grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br text-xl",
                  a.gradient,
                )}
              >
                {a.emoji}
              </span>
              <p className="mt-2 text-sm font-medium text-zinc-900">{a.name}</p>
              <p className="mt-0.5 text-xs text-zinc-500">{a.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-zinc-700">3. Tone & variations</p>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="flex flex-wrap gap-2">
            {TONES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTone(t.id)}
                title={t.hint}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm transition",
                  tone === t.id
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : "border-zinc-200 text-zinc-600 hover:border-zinc-300",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="mt-4">
            <span className="text-xs font-medium text-zinc-600">
              Video variations — each gets a different hook
            </span>
            <div className="mt-2 flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setCount(n)}
                  className={cn(
                    "h-9 w-9 rounded-lg border text-sm font-medium transition",
                    count === n
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-zinc-200 text-zinc-600 hover:border-zinc-300",
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}

      <Button type="submit" variant="accent" disabled={pending}>
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Wand2 className="h-4 w-4" />
        )}
        {pending ? "Writing scripts…" : "Generate scripts"}
      </Button>
      <p className="-mt-3 text-xs text-zinc-400">
        Scripts are free to generate and edit — videos only render after you approve them.
      </p>
    </form>
  );
}
