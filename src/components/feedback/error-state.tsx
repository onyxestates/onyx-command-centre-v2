import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function ErrorState({ message, actionLabel, onAction, details }: { message: string; actionLabel?: string; onAction?: () => void; details?: ReactNode }) {
  return (
    <Card className="p-6 text-sm text-zinc-300">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3 text-rose-300"><AlertTriangle className="size-4" /> {message}</div>
          {details ? <div className="mt-3 text-xs text-zinc-500">{details}</div> : null}
        </div>
        {actionLabel && onAction ? <Button type="button" className="px-3 py-2 text-xs" onClick={onAction}>{actionLabel}</Button> : null}
      </div>
    </Card>
  );
}
