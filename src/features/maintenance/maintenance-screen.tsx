"use client";

import { useMemo, useState } from "react";
import { AccessState } from "@/components/feedback/access-state";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { advanceMaintenanceIssueStatus, uploadMaintenanceTicketEvidence, useWorkspaceCollections } from "@/hooks/use-onyx-data";
import { formatRelative } from "@/lib/utils/format";
import { canManageMaintenanceIssue, hasPermission, isContractor } from "@/lib/utils/permissions";
import type { MaintenanceIssue } from "@/types/app";

function getNextIssueAction(issue: MaintenanceIssue) {
  switch (issue.status) {
    case "open":
      return { label: "Triage issue", nextStatus: "triaged" as const };
    case "triaged":
      return { label: "Schedule vendor", nextStatus: "scheduled" as const };
    case "scheduled":
      return { label: "Start work", nextStatus: "in_progress" as const };
    case "in_progress":
      return { label: "Mark resolved", nextStatus: "resolved" as const };
    case "resolved":
      return { label: "Close ticket", nextStatus: "closed" as const };
    default:
      return null;
  }
}

export function MaintenanceScreen() {
  const { member, user, profile, workspaceId } = useAuth();
  const { maintenance } = useWorkspaceCollections();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const canAccessModule = hasPermission(member, "canManageMaintenance") || hasPermission(member, "canUploadMaintenanceEvidence") || isContractor(member);

  const visibleIssues = useMemo(
    () => maintenance.data.filter((issue) => canManageMaintenanceIssue(member, user?.uid, issue)),
    [maintenance.data, member, user?.uid]
  );

  if (!canAccessModule) return <AccessState />;
  if (maintenance.loading) return <LoadingState />;
  if (maintenance.error) return <ErrorState message={maintenance.error} />;
  if (!visibleIssues.length) return <EmptyState title="No maintenance issues" description="Assigned maintenance work and uploaded evidence will appear here as soon as incidents are created." />;

  return (
    <div className="space-y-6">
      <PageHeader title="Maintenance" description="Issue triage, vendor assignment, evidence uploads, cost exposure, and resolution tracking across the portfolio." />

      {feedback ? <Card className="border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-100">{feedback}</Card> : null}

      <div className="grid gap-4 xl:grid-cols-2">
        {visibleIssues.map((issue) => {
          const nextAction = getNextIssueAction(issue);
          const attachmentCount = issue.attachments?.length ?? issue.evidence?.length ?? 0;
          const canOperateIssue = canManageMaintenanceIssue(member, user?.uid, issue);

          return (
            <Card key={issue.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{issue.title}</h3>
                  <p className="mt-1 text-xs text-zinc-500">{issue.listingId} • {issue.category} • Opened {formatRelative(issue.createdAt)}</p>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <Badge className="border-amber-500/20 text-amber-100">{issue.severity}</Badge>
                  <Badge className="border-white/10 text-zinc-200">{issue.status.replaceAll("_", " ")}</Badge>
                </div>
              </div>

              {issue.description ? <p className="mt-4 text-sm text-zinc-300">{issue.description}</p> : null}

              <div className="mt-4 grid gap-3 rounded-2xl border border-white/6 bg-white/[0.02] p-4 text-sm md:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Assigned</p>
                  <p className="mt-1 text-zinc-200">{issue.vendorName ?? issue.assigneeName ?? "Unassigned"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Estimated cost</p>
                  <p className="mt-1 text-zinc-200">{issue.cost?.estimate ? `£${issue.cost.estimate}` : "Not set"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Evidence files</p>
                  <p className="mt-1 text-zinc-200">{attachmentCount}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Resolution</p>
                  <p className="mt-1 text-zinc-200">{issue.resolution?.resolvedAt ? formatRelative(issue.resolution.resolvedAt) : "Pending"}</p>
                </div>
              </div>

              {(issue.attachments?.length ?? 0) > 0 ? (
                <div className="mt-4 space-y-2">
                  {issue.attachments?.map((attachment) => (
                    <a
                      key={`${issue.id}:${attachment.url}`}
                      href={attachment.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-xl border border-white/6 bg-black/20 px-3 py-2 text-sm text-zinc-200 transition hover:border-white/20 hover:text-white"
                    >
                      {attachment.name}
                    </a>
                  ))}
                </div>
              ) : null}

              <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]">
                <Input
                  type="file"
                  accept="image/*,application/pdf"
                  disabled={!workspaceId || !user || !canOperateIssue || busyKey === `upload:${issue.id}`}
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!workspaceId || !user || !file || !canOperateIssue) return;
                    setFeedback(null);
                    setBusyKey(`upload:${issue.id}`);
                    try {
                      await uploadMaintenanceTicketEvidence(workspaceId, issue.id, file, user.uid, profile?.displayName ?? "Operations");
                      setFeedback(`${file.name} uploaded to ${issue.title}.`);
                    } catch (error) {
                      setFeedback(error instanceof Error ? error.message : "Unable to upload maintenance evidence.");
                    } finally {
                      event.target.value = "";
                      setBusyKey(null);
                    }
                  }}
                />

                {nextAction && canOperateIssue ? (
                  <Button
                    type="button"
                    disabled={!workspaceId || !user || busyKey === issue.id}
                    onClick={async () => {
                      if (!workspaceId || !user) return;
                      setFeedback(null);
                      setBusyKey(issue.id);
                      try {
                        await advanceMaintenanceIssueStatus(workspaceId, issue, nextAction.nextStatus, user.uid, profile?.displayName ?? "Operations");
                        setFeedback(`${issue.title} moved to ${nextAction.nextStatus.replaceAll("_", " ")}.`);
                      } catch (error) {
                        setFeedback(error instanceof Error ? error.message : "Unable to advance maintenance issue.");
                      } finally {
                        setBusyKey(null);
                      }
                    }}
                  >
                    {busyKey === issue.id ? "Saving…" : nextAction.label}
                  </Button>
                ) : null}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
