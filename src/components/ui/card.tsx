import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-zinc-200/70 bg-white shadow-[0_1px_2px_rgba(9,9,11,0.04),0_8px_24px_rgba(9,9,11,0.05)]",
        className,
      )}
      {...props}
    />
  );
}
