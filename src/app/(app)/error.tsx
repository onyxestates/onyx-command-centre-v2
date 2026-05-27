"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/feedback/error-state";
import { logError } from "@/lib/monitoring/logger";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    logError("Protected module error", error, { digest: error.digest });
  }, [error]);

  return <ErrorState message={error.message || "Unable to load this workspace module."} actionLabel="Retry module" onAction={() => reset()} details={error.digest ? `Error digest: ${error.digest}` : undefined} />;
}
