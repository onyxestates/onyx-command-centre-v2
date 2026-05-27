"use client";

import { AccessState } from "@/components/feedback/access-state";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useWorkspaceCollections } from "@/hooks/use-onyx-data";
import { hasPermission, roleLabel } from "@/lib/utils/permissions";

export function SettingsScreen() {
  const { workspace, member, profile } = useAuth();
  const { vendors } = useWorkspaceCollections();

  if (!hasPermission(member, "canManageSettings")) {
    return <AccessState />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Workspace-level operational defaults, role context, and preferred vendor controls." />
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="p-5">
          <h3 className="font-semibold">Workspace defaults</h3>
          <div className="mt-4 space-y-2 text-sm text-zinc-300">
            <p>Name: {workspace?.name ?? "—"}</p>
            <p>Timezone: {workspace?.timezone ?? "—"}</p>
            <p>Currency: {workspace?.currency ?? "—"}</p>
            <p>Check-in: {workspace?.settings?.defaultCheckInTime ?? "—"}</p>
            <p>Check-out: {workspace?.settings?.defaultCheckOutTime ?? "—"}</p>
            <p>Cleaning photos required: {workspace?.settings?.requireCleaningPhotos ? "Yes" : "No"}</p>
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold">Operator profile</h3>
          <div className="mt-4 space-y-2 text-sm text-zinc-300">
            <p>Name: {profile?.displayName ?? "—"}</p>
            <p>Email: {profile?.email ?? "—"}</p>
            <p>Role: {roleLabel(member?.role)}</p>
            <p>Assignments: {(member?.assignedListingIds ?? []).length}</p>
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold">Preferred vendors</h3>
          <div className="mt-4 space-y-2 text-sm text-zinc-300">
            {vendors.data.slice(0, 5).map((vendor) => (
              <div key={vendor.id} className="rounded-xl border border-white/6 p-3">
                <p className="font-medium">{vendor.name}</p>
                <p className="text-xs text-zinc-500">{vendor.category} • {vendor.phone ?? "No phone"}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
