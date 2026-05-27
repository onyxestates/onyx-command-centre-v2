"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/feedback/error-state";
import { logError } from "@/lib/monitoring/logger";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    logError("Root app route error", error, { digest: error.digest });
  }, [error]);

  return (
    <main className="min-h-screen p-6">
      <ErrorState message={error.message} actionLabel="Retry" onAction={() => reset()} details={error.digest ? `Error digest: ${error.digest}` : undefined} />
    </main>
  );
}
