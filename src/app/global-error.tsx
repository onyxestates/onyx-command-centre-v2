"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/feedback/error-state";
import { logError } from "@/lib/monitoring/logger";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    logError("Unhandled application error", error, { digest: error.digest });
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen p-6">
        <ErrorState message={error.message || "A fatal application error occurred."} actionLabel="Retry application" onAction={() => reset()} details={error.digest ? `Error digest: ${error.digest}` : undefined} />
      </body>
    </html>
  );
}
