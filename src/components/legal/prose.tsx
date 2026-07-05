import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function H2({ className, ...props }: ComponentProps<"h2">) {
  return (
    <h2
      className={cn(
        "mt-10 text-lg font-semibold tracking-tight text-white",
        className,
      )}
      {...props}
    />
  );
}

export function P({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      className={cn("mt-3 text-[15px] leading-7 text-zinc-400", className)}
      {...props}
    />
  );
}

export function UL({ className, ...props }: ComponentProps<"ul">) {
  return (
    <ul
      className={cn(
        "mt-3 space-y-2 pl-1 text-[15px] leading-7 text-zinc-400 [&>li]:relative [&>li]:pl-5 [&>li]:before:absolute [&>li]:before:left-0 [&>li]:before:top-3 [&>li]:before:h-1.5 [&>li]:before:w-1.5 [&>li]:before:rounded-full [&>li]:before:bg-indigo-400/70",
        className,
      )}
      {...props}
    />
  );
}

export function A({ className, ...props }: ComponentProps<"a">) {
  return (
    <a
      className={cn(
        "text-indigo-300 underline decoration-indigo-300/40 underline-offset-2 transition hover:text-indigo-200",
        className,
      )}
      {...props}
    />
  );
}
