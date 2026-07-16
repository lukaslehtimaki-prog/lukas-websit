"use client";

import { useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";

/** Password input with a show/hide toggle, matching the auth Field styling. */
export function PasswordField({
  label,
  ...props
}: { label: string } & Omit<ComponentProps<"input">, "type">) {
  const [show, setShow] = useState(false);
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-zinc-700">{label}</span>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 pr-10 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-400 hover:text-zinc-700"
          tabIndex={-1}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </label>
  );
}
