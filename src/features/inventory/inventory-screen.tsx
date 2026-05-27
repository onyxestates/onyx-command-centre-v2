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
import { hasPermission } from "@/lib/utils/permissions";

export function InventoryScreen() {
  const { member } = useAuth();
  const { inventory } = useWorkspaceCollections();
  const canAccessInventory = hasPermission(member, "canManageInventory") || hasPermission(member, "canManageCleanings");

  if (!canAccessInventory) return <AccessState />;
  if (inventory.loading) return <LoadingState />;
  if (inventory.error) return <ErrorState message={inventory.error} />;
  if (!inventory.data.length) return <EmptyState title="No stock items found" description="Run the demo seed or connect live inventory to monitor low-stock risk." />;

  return (
    <div className="space-y-6">
      <PageHeader title="Inventory" description="Stock health across linen, toiletries, kitchen items, cleaning kits, and coffee replenishment." />
      <DataTable
        columns={["Item", "Category", "Quantity", "Threshold", "Status"]}
        rows={inventory.data.map((item) => [
          <div key={item.id}>
            <p className="font-medium">{item.name}</p>
            <p className="text-xs text-zinc-500">{item.listingId ?? "Workspace"}</p>
          </div>,
          item.category,
          `${item.quantity} ${item.unit}`,
          item.reorderThreshold,
          <Badge key="status">{item.status}</Badge>,
        ])}
      />
    </div>
  );
}
