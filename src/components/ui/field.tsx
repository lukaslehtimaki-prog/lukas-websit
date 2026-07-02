import type { ComponentProps } from "react";

/** Labeled text input used across the auth forms. */
export function Field({
  label,
  ...props
}: { label: string } & ComponentProps<"input">) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-zinc-700">{label}</span>
      <input
        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        {...props}
      />
    </label>
  );
}
