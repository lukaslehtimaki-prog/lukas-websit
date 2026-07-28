import type { ReactNode } from "react";

/**
 * Remounts on every dashboard page navigation (unlike the layout), giving each
 * page a subtle entrance without touching individual pages. Pure CSS —
 * reduced-motion users get no animation via the global media query.
 */
export default function DashboardTemplate({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="page-in">{children}</div>;
}
