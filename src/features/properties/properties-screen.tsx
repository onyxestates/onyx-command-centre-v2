"use client";

import { DataTable } from "@/components/data/data-table";
import { AccessState } from "@/components/feedback/access-state";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useWorkspaceCollections } from "@/hooks/use-onyx-data";
import { formatCurrency, formatPercent } from "@/lib/utils/format";
import { hasPermission } from "@/lib/utils/permissions";

export function PropertiesScreen() {
  const { member } = useAuth();
  const { listings } = useWorkspaceCollections();
  if (!hasPermission(member, "canManageListings")) return <AccessState />;
  if (listings.loading) return <LoadingState />;
  if (listings.error) return <ErrorState message={listings.error} />;
  if (!listings.data.length) return <EmptyState title="No properties seeded" description="Seed listings or create your first property to start tracking operations." />;
  return <div className="space-y-6"><PageHeader title="Properties" description="Premium portfolio operations view with occupancy, revenue, and attention flags across every listing." /><DataTable columns={["Listing", "Status", "Revenue MTD", "Occupancy", "Flags"]} rows={listings.data.map((item) => [<div key={item.id}><p className="font-medium">{item.name}</p><p className="text-xs text-zinc-500">{item.address.city} • {item.internalCode}</p></div>, <Badge key="status">{item.status}</Badge>, formatCurrency(item.statsSnapshot?.revenueMtd), formatPercent(item.statsSnapshot?.occupancy30d), <div key="flags" className="flex flex-wrap gap-2">{item.flags?.attentionRequired ? <Badge className="border-amber-500/30 text-amber-200">Attention</Badge> : null}{item.flags?.maintenanceOpen ? <Badge className="border-rose-500/30 text-rose-200">Maintenance</Badge> : null}{item.flags?.lowStock ? <Badge className="border-sky-500/30 text-sky-200">Low stock</Badge> : null}</div>])} /></div>;
}
