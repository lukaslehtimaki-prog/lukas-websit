"use client";

import { Sun, Moon, Monitor, Check } from "lucide-react";
import { useTheme, type ThemePref } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";

const OPTS: {
  value: ThemePref;
  Icon: typeof Sun;
  title: string;
  desc: string;
}[] = [
  { value: "light", Icon: Sun, title: "Light", desc: "Bright, classic dashboard." },
  { value: "dark", Icon: Moon, title: "Dark", desc: "Easy on the eyes in low light." },
  { value: "system", Icon: Monitor, title: "System", desc: "Match your device setting." },
];

export function Appearance() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {OPTS.map(({ value, Icon, title, desc }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            onClick={() => setTheme(value)}
            className={cn(
              "relative cursor-pointer rounded-xl border p-4 text-left transition",
              active
                ? "border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-500/10"
                : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700",
            )}
          >
            {active ? (
              <Check className="absolute right-3 top-3 h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            ) : null}
            <span
              className={cn(
                "grid h-10 w-10 place-items-center rounded-lg",
                active
                  ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300"
                  : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
              )}
            >
              <Icon className="h-5 w-5" />
            </span>
            <div className="mt-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {title}
            </div>
            <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              {desc}
            </div>
          </button>
        );
      })}
    </div>
  );
}
