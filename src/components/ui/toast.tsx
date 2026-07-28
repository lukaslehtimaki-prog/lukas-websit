"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "success" | "error" | "info";

type ToastItem = {
  id: number;
  message: string;
  variant: ToastVariant;
  leaving: boolean;
};

type ToastContextValue = {
  toast: (message: string, variant?: ToastVariant) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * App-wide toast notifications. `toast("Saved ✓")` from any client component
 * under the provider. Success is inferred as the default; messages containing
 * obvious failure wording can be passed variant "error" explicitly.
 */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

const DISMISS_MS = 3800;
const LEAVE_MS = 200;

const ICONS: Record<ToastVariant, ReactNode> = {
  success: <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-emerald-500" />,
  error: <AlertCircle className="h-4.5 w-4.5 shrink-0 text-red-500" />,
  info: <Info className="h-4.5 w-4.5 shrink-0 text-indigo-500" />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setItems((prev) =>
      prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)),
    );
    setTimeout(
      () => setItems((prev) => prev.filter((t) => t.id !== id)),
      LEAVE_MS,
    );
  }, []);

  const toast = useCallback(
    (message: string, variant: ToastVariant = "success") => {
      const id = nextId.current++;
      setItems((prev) => [...prev.slice(-3), { id, message, variant, leaving: false }]);
      setTimeout(() => dismiss(id), DISMISS_MS);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2"
      >
        {items.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-start gap-2.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-sm text-zinc-800 shadow-lg shadow-zinc-900/5 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:shadow-black/30",
              t.leaving ? "toast-out" : "toast-in",
            )}
          >
            {ICONS[t.variant]}
            <p className="min-w-0 flex-1 break-words leading-snug">{t.message}</p>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => dismiss(t.id)}
              className="shrink-0 rounded-md p-0.5 text-zinc-400 transition-colors hover:text-zinc-700 dark:hover:text-zinc-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
