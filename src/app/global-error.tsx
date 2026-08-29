"use client";

import { useEffect } from "react";

/**
 * Last-resort boundary: replaces the root layout when it is the root layout
 * itself that threw, so it must ship its own <html>/<body> and cannot rely on
 * the global stylesheet being applied. Inline styles only, deliberately.
 *
 * `metadata` is not supported here (client component), hence the <title> tag.
 */
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[global] unhandled error", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#05060a",
          color: "#e4e4e7",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          padding: "24px",
        }}
      >
        <title>Something went wrong · Sitagio</title>
        <main style={{ maxWidth: "28rem", textAlign: "center" }}>
          <p
            style={{
              margin: 0,
              fontSize: "12px",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#818cf8",
              fontWeight: 600,
            }}
          >
            Sitagio
          </p>
          <h1
            style={{
              margin: "16px 0 0",
              fontSize: "28px",
              lineHeight: 1.2,
              fontWeight: 600,
              color: "#fff",
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              margin: "16px 0 0",
              fontSize: "15px",
              lineHeight: 1.7,
              color: "#a1a1aa",
            }}
          >
            The page could not be loaded. Try again, or email
            support@sitovaiagency.com — we reply within 1 business day.
          </p>
          {error.digest ? (
            <p
              style={{
                margin: "12px 0 0",
                fontSize: "12px",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                color: "#52525b",
              }}
            >
              Reference: {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => unstable_retry()}
            style={{
              marginTop: "28px",
              cursor: "pointer",
              border: 0,
              borderRadius: "10px",
              padding: "11px 22px",
              fontSize: "15px",
              fontWeight: 600,
              color: "#fff",
              background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
