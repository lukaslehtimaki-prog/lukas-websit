"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme, type ThemePref } from "./theme-provider";
import { cn } from "@/lib/utils";

const OPTS: { value: ThemePref; Icon: typeof Sun; label: string }[] = [
  { value: "light", Icon: Sun, label: "Light" },
  { value: "dark", Icon: Moon, label: "Dark" },
  { value: "system", Icon: Monitor, label: "System" },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="inline-flex items-center rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 dark:border-zinc-700 dark:bg-zinc-800">
      {OPTS.map(({ value, Icon, label }) => (
        <button
          key={value}
          type="button"
          aria-label={`${label} theme`}
          aria-pressed={theme === value}
          onClick={() => setTheme(value)}
          className={cn(
            "grid h-7 w-7 cursor-pointer place-items-center rounded-md transition",
            theme === value
              ? "bg-white text-indigo-600 shadow-sm dark:bg-zinc-950 dark:text-indigo-400"
              : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200",
          )}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}
