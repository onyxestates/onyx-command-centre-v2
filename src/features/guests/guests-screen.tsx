"use client";

import { AccessState } from "@/components/feedback/access-state";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useWorkspaceCollections } from "@/hooks/use-onyx-data";
import { formatRelative } from "@/lib/utils/format";
import { hasPermission } from "@/lib/utils/permissions";

export function GuestsScreen() {
  const { member } = useAuth();
  const { threads } = useWorkspaceCollections();

  if (!hasPermission(member, "canManageGuests")) return <AccessState />;
  if (threads.loading) return <LoadingState />;
  if (threads.error) return <ErrorState message={threads.error} />;
  if (!threads.data.length) return <EmptyState title="No guest conversations" description="Guest data is created automatically when reservation-linked messaging begins." />;

  const openCount = threads.data.filter((thread) => thread.status === "open").length;
  const pendingCount = threads.data.filter((thread) => thread.status === "pending").length;
  const resolvedCount = threads.data.filter((thread) => thread.status === "resolved").length;

  return (
    <div className="space-y-6">
      <PageHeader title="Guests" description="Relationship view across open threads, unread handoffs, escalations, and guest communication health." />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5"><p className="text-sm text-zinc-400">Open threads</p><p className="mt-3 text-3xl font-semibold tracking-tight">{openCount}</p></Card>
        <Card className="p-5"><p className="text-sm text-zinc-400">Pending follow-up</p><p className="mt-3 text-3xl font-semibold tracking-tight">{pendingCount}</p></Card>
        <Card className="p-5"><p className="text-sm text-zinc-400">Resolved</p><p className="mt-3 text-3xl font-semibold tracking-tight">{resolvedCount}</p></Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {threads.data.map((thread) => (
          <Card key={thread.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{thread.guest.name}</h3>
                <p className="text-xs text-zinc-500">{thread.listingId}</p>
              </div>
              <Badge>{thread.status}</Badge>
            </div>
            <p className="mt-4 text-sm text-zinc-300">{thread.lastMessagePreview ?? "No recent preview."}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge className="border-white/10 text-zinc-300">{thread.unreadCounts?.teamUnread ?? 0} unread</Badge>
              {thread.escalation?.hasOpenIssue ? <Badge className="border-amber-500/30 text-amber-200">Escalated</Badge> : null}
              {thread.tags?.slice(0, 2).map((tag) => <Badge key={tag} className="border-white/10 text-zinc-300">{tag}</Badge>)}
            </div>
            <div className="mt-4 text-xs text-zinc-500">Last updated {formatRelative(thread.lastMessageAt)}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
