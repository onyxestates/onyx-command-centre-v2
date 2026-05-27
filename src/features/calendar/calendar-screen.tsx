"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { useWorkspaceCollections } from "@/hooks/use-onyx-data";
import { formatDateTime } from "@/lib/utils/format";

export function CalendarScreen() {
  const { reservations, cleanings } = useWorkspaceCollections();
  const timeline = [
    ...reservations.data.slice(0, 6).map((item) => ({ id: item.id, label: `${item.guest.primaryName} check-in`, date: item.checkInAt, meta: item.listingId })),
    ...cleanings.data.slice(0, 6).map((item) => ({ id: item.id, label: `Cleaning • ${item.listingId}`, date: item.scheduledStartAt, meta: item.assignedCleanerName ?? "Unassigned" }))
  ].sort((a, b) => (a.date.seconds ?? 0) - (b.date.seconds ?? 0));

  return <div className="space-y-6"><PageHeader title="Calendar" description="Operational timeline for arrivals, departures, and turnover execution across the workspace." /><div className="grid gap-4">{timeline.map((item) => <Card key={item.id} className="p-4"><div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between"><div><p className="font-medium">{item.label}</p><p className="text-xs text-zinc-500">{item.meta}</p></div><p className="text-sm text-zinc-300">{formatDateTime(item.date)}</p></div></Card>)}</div></div>;
}
