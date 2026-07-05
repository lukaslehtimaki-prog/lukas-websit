"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type ThemePref = "light" | "dark" | "system";
export type Resolved = "light" | "dark";

export const THEME_PREF_KEY = "sitexa-theme";
export const THEME_COOKIE = "sitexa-theme-resolved";

type Ctx = {
  theme: ThemePref;
  resolved: Resolved;
  setTheme: (t: ThemePref) => void;
};

const ThemeContext = createContext<Ctx | null>(null);

function systemDark(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

function resolve(pref: ThemePref): Resolved {
  return pref === "dark" || (pref === "system" && systemDark()) ? "dark" : "light";
}

function writeCookie(resolved: Resolved) {
  document.cookie = `${THEME_COOKIE}=${resolved}; path=/; max-age=31536000; samesite=lax`;
}

/**
 * Scopes dark mode to the dashboard: renders a wrapper that carries the `.dark`
 * class. The server sets the initial value from a cookie (no flash); the client
 * keeps it in sync with the user's saved preference / OS setting.
 */
export function ThemeProvider({
  initialResolved,
  children,
}: {
  initialResolved: Resolved;
  children: React.ReactNode;
}) {
  const [theme, setThemeState] = useState<ThemePref>("system");
  const [resolved, setResolved] = useState<Resolved>(initialResolved);

  useEffect(() => {
    const pref =
      (localStorage.getItem(THEME_PREF_KEY) as ThemePref | null) ?? "system";
    setThemeState(pref);
    const r = resolve(pref);
    setResolved(r);
    writeCookie(r);
  }, []);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const r = resolve("system");
      setResolved(r);
      writeCookie(r);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = useCallback((t: ThemePref) => {
    localStorage.setItem(THEME_PREF_KEY, t);
    setThemeState(t);
    const r = resolve(t);
    setResolved(r);
    writeCookie(r);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme }}>
      <div className={resolved === "dark" ? "dark" : undefined}>{children}</div>
    </ThemeContext.Provider>
  );
}

export function useTheme(): Ctx {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
