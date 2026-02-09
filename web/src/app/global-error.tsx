"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            fontFamily: "system-ui",
          }}
        >
          <h2>Something went wrong</h2>
          <p>We are working on fixing this. Please try again.</p>
          <button
            onClick={() => reset()}
            style={{
              padding: "10px 20px",
              marginTop: "20px",
              cursor: "pointer",
              borderRadius: "6px",
              border: "1px solid #ccc",
              background: "#fff",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
