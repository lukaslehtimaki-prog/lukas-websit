import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const variants = {
  default: "bg-zinc-100 text-zinc-700",
  accent: "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-100",
  success: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100",
  warning: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-100",
  outline: "border border-zinc-200 text-zinc-600",
} as const;

export function Badge({
  variant = "default",
  className,
  ...props
}: ComponentProps<"span"> & { variant?: keyof typeof variants }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
