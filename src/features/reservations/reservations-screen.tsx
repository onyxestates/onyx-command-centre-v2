"use client";

import { useMemo, useState } from "react";
import { DataTable } from "@/components/data/data-table";
import { AccessState } from "@/components/feedback/access-state";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { syncAllReservationStatuses, syncReservationLifecycle, useWorkspaceCollections } from "@/hooks/use-onyx-data";
import { formatCurrency, formatDateTime } from "@/lib/utils/format";
import { hasPermission } from "@/lib/utils/permissions";

export function ReservationsScreen() {
  const { member, user, profile, workspaceId } = useAuth();
  const { reservations, cleanings } = useWorkspaceCollections();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const cleaningMap = useMemo(() => new Map(cleanings.data.map((job) => [job.id, job])), [cleanings.data]);

  if (!hasPermission(member, "canManageReservations")) return <AccessState />;
  if (reservations.loading || cleanings.loading) return <LoadingState />;
  if (reservations.error || cleanings.error) return <ErrorState message={reservations.error ?? cleanings.error ?? "Unable to load reservations."} />;
  if (!reservations.data.length) return <EmptyState title="No reservations loaded" description="The reservation board will populate once demo bookings or live OTA sync data is available." />;

  return (
    <div className="space-y-6">
      <PageHeader title="Reservations" description="Stay lifecycle, check-in timing, guest load, and operational readiness in one control table." />

      <Card className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-100">Lifecycle sync</p>
          <p className="mt-1 text-sm text-zinc-500">Reconciles reservation status against current time and linked cleaning readiness.</p>
        </div>
        <Button
          type="button"
          disabled={!workspaceId || !user || busyKey === "sync-all"}
          onClick={async () => {
            if (!workspaceId || !user) return;
            setFeedback(null);
            setBusyKey("sync-all");
            try {
              const results = await syncAllReservationStatuses(workspaceId, reservations.data, cleanings.data, user.uid, profile?.displayName ?? "Operations");
              const changed = results.filter((item) => reservations.data.find((reservation) => reservation.id === item.reservationId)?.status !== item.nextStatus).length;
              setFeedback(changed ? `${changed} reservation lifecycle statuses synced.` : "All reservation statuses were already in sync.");
            } catch (error) {
              setFeedback(error instanceof Error ? error.message : "Unable to sync reservation statuses.");
            } finally {
              setBusyKey(null);
            }
          }}
        >
          {busyKey === "sync-all" ? "Syncing…" : "Sync all statuses"}
        </Button>
      </Card>

      {feedback ? (
        <Card className="border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-100">{feedback}</Card>
      ) : null}

      <DataTable
        columns={["Guest", "Status", "Stay window", "Source", "Housekeeping", "Value", "Action"]}
        rows={reservations.data.map((item) => {
          const linkedCleaning = item.operational?.cleaningJobId ? cleaningMap.get(item.operational.cleaningJobId) ?? null : null;
          return [
            <div key={item.id}>
              <p className="font-medium">{item.guest.primaryName}</p>
              <p className="text-xs text-zinc-500">{item.guest.adults} adults • {item.listingId}</p>
            </div>,
            <Badge key="status">{item.status.replaceAll("_", " ")}</Badge>,
            <div key="dates" className="text-xs text-zinc-300">
              {formatDateTime(item.checkInAt)}
              <br />
              {formatDateTime(item.checkOutAt)}
            </div>,
            item.source,
            <div key="cleaning" className="text-xs text-zinc-300">
              <p>{linkedCleaning ? linkedCleaning.status.replaceAll("_", " ") : "No linked job"}</p>
              <p className="text-zinc-500">{linkedCleaning?.completion?.readyForArrival ? "Ready for arrival" : "Awaiting turnover"}</p>
            </div>,
            formatCurrency(item.financials?.grossAmount, item.financials?.currency),
            <Button
              key="action"
              type="button"
              className="px-3 py-1.5 text-xs"
              disabled={!workspaceId || !user || busyKey === item.id}
              onClick={async () => {
                if (!workspaceId || !user) return;
                setFeedback(null);
                setBusyKey(item.id);
                try {
                  const nextStatus = await syncReservationLifecycle(workspaceId, item, linkedCleaning, user.uid, profile?.displayName ?? "Operations");
                  setFeedback(`${item.guest.primaryName} is now ${nextStatus.replaceAll("_", " ")}.`);
                } catch (error) {
                  setFeedback(error instanceof Error ? error.message : "Unable to sync reservation lifecycle.");
                } finally {
                  setBusyKey(null);
                }
              }}
            >
              {busyKey === item.id ? "Saving…" : "Sync"}
            </Button>,
          ];
        })}
      />
    </div>
  );
}
