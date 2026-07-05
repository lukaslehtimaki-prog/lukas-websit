import type { ReactNode } from "react";

export function ComingSoon({
  phase,
  title,
  points,
  icon,
}: {
  phase: string;
  title: string;
  points: string[];
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-8 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
        {icon}
      </div>
      <span className="mt-4 inline-block rounded-full bg-zinc-100 dark:bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-300">
        {phase}
      </span>
      <h2 className="mt-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
      <ul className="mx-auto mt-4 max-w-md space-y-2 text-left text-sm text-zinc-600 dark:text-zinc-300">
        {points.map((point, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-0.5 text-indigo-500">•</span>
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
