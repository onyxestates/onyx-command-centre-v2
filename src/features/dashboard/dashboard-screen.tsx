"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/data/stat-card";
import { TrendChartCard } from "@/components/data/trend-chart-card";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useDashboardData } from "@/hooks/use-onyx-data";
import { formatCurrency, formatPercent, formatRelative } from "@/lib/utils/format";
import { roleLabel } from "@/lib/utils/permissions";

export function DashboardScreen() {
  const data = useDashboardData();
  const { member } = useAuth();
  const [heartbeat, setHeartbeat] = useState(() => Date.now());
  const listingNames = new Map(data.listings.data.map((listing) => [listing.id, listing.name]));

  useEffect(() => {
    const timer = window.setInterval(() => setHeartbeat(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  if (data.listings.loading || data.reservations.loading || data.cleanings.loading || data.maintenance.loading) return <LoadingState />;
  if (data.listings.error || data.reservations.error || data.cleanings.error || data.maintenance.error) {
    return <ErrorState message={data.listings.error ?? data.reservations.error ?? data.cleanings.error ?? data.maintenance.error ?? "Unable to load dashboard."} />;
  }
  if (!data.listings.data.length && !data.cleanings.data.length && !data.maintenance.data.length) {
    return <EmptyState title="No operational data yet" description="Seed the demo workspace or connect production Firestore data to populate the command centre." />;
  }

  void heartbeat;
  const operationalBoard = [...data.derived.arrivalsToday, ...data.derived.departuresToday].slice(0, 8);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operations dashboard"
        description="Live portfolio health across revenue, arrivals, turnarounds, and incidents. Metrics stream directly from reservations, cleaning jobs, maintenance issues, and activity logs."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-emerald-500/30 text-emerald-200">Live stream active</Badge>
            <Badge className="border-white/10 text-zinc-300">{data.derived.liveUpdatedAt ? `Updated ${formatRelative(data.derived.liveUpdatedAt)}` : "Awaiting live events"}</Badge>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Revenue MTD" value={formatCurrency(data.derived.revenueMtd)} hint="Derived from non-cancelled reservation gross values this month" />
        <StatCard label="Occupancy 30d" value={formatPercent(data.derived.occupancy)} hint="Booked nights divided by total available listing nights" />
        <StatCard label="Arrivals today" value={String(data.derived.checkInsCount)} hint="Reservations scheduled to check in today" />
        <StatCard label="Departures today" value={String(data.derived.checkOutsCount)} hint="Reservations scheduled to check out today" />
        <StatCard label="Pending cleanings" value={String(data.derived.pendingCleaningsCount)} hint={`${member ? roleLabel(member.role) : "Operator"} workload across active turnovers`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5"><p className="text-sm text-zinc-400">Unread guest threads</p><p className="mt-3 text-3xl font-semibold tracking-tight">{data.derived.unreadThreadsCount}</p></Card>
        <Card className="p-5"><p className="text-sm text-zinc-400">Open issues</p><p className="mt-3 text-3xl font-semibold tracking-tight">{data.derived.openIssuesCount}</p></Card>
        <Card className="p-5"><p className="text-sm text-zinc-400">Urgent focus items</p><p className="mt-3 text-3xl font-semibold tracking-tight">{data.derived.urgentIssues.length + data.derived.overdueCleanings.length}</p></Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <TrendChartCard title="Six-week booking pace" data={data.derived.trend} dataKey="revenue" />
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold">Live command feed</h3>
            <Badge className="border-white/10 text-zinc-300">{data.activityLogs.data.length} recent events</Badge>
          </div>
          <div className="mt-4 space-y-4">
            {data.activityLogs.data.slice(0, 6).map((item) => (
              <div key={item.id} className="rounded-xl border border-white/6 bg-white/[0.02] p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">{item.summary}</p>
                  <Badge>{item.action.replaceAll("_", " ")}</Badge>
                </div>
                <p className="mt-2 text-xs text-zinc-500">{item.actorName ?? "System"} • {formatRelative(item.createdAt)}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="p-5 xl:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold">Today&apos;s operational board</h3>
            <Badge className="border-white/10 text-zinc-300">{operationalBoard.length} active stays</Badge>
          </div>
          <div className="mt-4 space-y-3">
            {operationalBoard.length ? operationalBoard.map((item) => {
              const isArrival = data.derived.arrivalsToday.some((reservation) => reservation.id === item.id);
              return (
                <div key={item.id} className="flex flex-col gap-2 rounded-xl border border-white/6 p-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium">{item.guest.primaryName}</p>
                    <p className="text-xs text-zinc-500">{listingNames.get(item.listingId) ?? item.listingId} • {item.source}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={isArrival ? "border-emerald-500/30 text-emerald-200" : "border-sky-500/30 text-sky-200"}>{isArrival ? "arrival" : "departure"}</Badge>
                    <Badge className="border-white/10 text-zinc-200">{item.status.replaceAll("_", " ")}</Badge>
                    <div className="text-sm text-zinc-300">{formatRelative(isArrival ? item.checkInAt : item.checkOutAt)}</div>
                  </div>
                </div>
              );
            }) : <EmptyState title="No arrivals or departures today" description="Upcoming movement will appear here automatically as reservations approach check-in and check-out." />}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold">Urgent focus</h3>
            <Badge className="border-amber-500/30 text-amber-200">{data.derived.urgentIssues.length + data.derived.overdueCleanings.length} items</Badge>
          </div>
          <div className="mt-4 space-y-3">
            {data.derived.urgentIssues.map((issue) => (
              <div key={issue.id} className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                <p className="font-medium">{issue.title}</p>
                <p className="mt-1 text-xs text-zinc-400">{listingNames.get(issue.listingId) ?? issue.listingId} • {issue.vendorName ?? issue.assigneeName ?? "Unassigned"}</p>
              </div>
            ))}
            {data.derived.overdueCleanings.map((job) => (
              <div key={job.id} className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-3">
                <p className="font-medium">{listingNames.get(job.listingId) ?? job.listingId} cleaning requires follow-up</p>
                <p className="mt-1 text-xs text-zinc-400">{job.assignedCleanerName ?? "Unassigned"} • {job.status.replaceAll("_", " ")}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
