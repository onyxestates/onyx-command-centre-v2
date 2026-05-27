"use client";

import { AccessState } from "@/components/feedback/access-state";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/data/stat-card";
import { TrendChartCard } from "@/components/data/trend-chart-card";
import { useAuth } from "@/hooks/use-auth";
import { useWorkspaceCollections } from "@/hooks/use-onyx-data";
import { formatCurrency } from "@/lib/utils/format";
import { hasPermission } from "@/lib/utils/permissions";

const series = [{ label: "W1", revenue: 4200 }, { label: "W2", revenue: 5100 }, { label: "W3", revenue: 4600 }, { label: "W4", revenue: 5900 }, { label: "W5", revenue: 6100 }, { label: "W6", revenue: 6400 }];

export function ReportsScreen() {
  const { member } = useAuth();
  const { listings, maintenance, cleanings } = useWorkspaceCollections();
  if (!hasPermission(member, "canViewAnalytics")) return <AccessState />;
  const revenue = listings.data.reduce((sum, item) => sum + (item.statsSnapshot?.revenueMtd ?? 0), 0);
  return <div className="space-y-6"><PageHeader title="Reports" description="Executive analytics for revenue, occupancy, issue burden, and operations throughput." /><div className="grid gap-4 md:grid-cols-3"><StatCard label="Revenue MTD" value={formatCurrency(revenue)} hint="Aggregated listing snapshot revenue" /><StatCard label="Open issues" value={String(maintenance.data.filter((item) => item.status !== "resolved" && item.status !== "closed").length)} hint="Issues requiring owner or operator follow-up" /><StatCard label="Completed cleanings" value={String(cleanings.data.filter((item) => item.status === "completed").length)} hint="Completed turnovers and QC approved jobs" /></div><TrendChartCard title="Weekly revenue trend" data={series} dataKey="revenue" /></div>;
}
