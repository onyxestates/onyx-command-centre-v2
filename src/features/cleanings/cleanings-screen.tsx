"use client";

import { useState } from "react";
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
import { transitionCleaningJob, updateCleaningChecklistItem, uploadCleaningCompletionPhoto, useWorkspaceCollections } from "@/hooks/use-onyx-data";
import { formatDateTime, formatRelative } from "@/lib/utils/format";
import { canManageCleaningJob, hasPermission, isElevatedOperator } from "@/lib/utils/permissions";
import type { CleaningJob } from "@/types/app";

function getNextCleaningAction(job: CleaningJob, elevatedOperator: boolean) {
  if (job.status === "pending" || job.status === "assigned" || job.status === "overdue") {
    return { label: "Start cleaning", nextStatus: "in_progress" as const };
  }
  if (job.status === "in_progress") {
    return { label: "Submit for review", nextStatus: "review" as const };
  }
  if (job.status === "review" && elevatedOperator) {
    return { label: "Approve ready for arrival", nextStatus: "completed" as const };
  }
  return null;
}

export function CleaningsScreen() {
  const { member, user, profile, workspaceId, workspace } = useAuth();
  const { cleanings } = useWorkspaceCollections();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const elevatedOperator = isElevatedOperator(member);
  const requirePhotos = workspace?.settings?.requireCleaningPhotos ?? false;

  if (!hasPermission(member, "canManageCleanings")) return <AccessState />;
  if (cleanings.loading) return <LoadingState />;
  if (cleanings.error) return <ErrorState message={cleanings.error} />;
  if (!cleanings.data.length) return <EmptyState title="No cleaning jobs" description="Turnovers, inspections, and same-day jobs will appear once seeded or synced." />;

  return (
    <div className="space-y-6">
      <PageHeader title="Cleanings" description="Turnover board with assignment, checklist completion, photo evidence, review gates, and arrival readiness tracking." />

      {feedback ? <Card className="border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-100">{feedback}</Card> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cleanings.data.map((job) => {
          const checklist = job.checklist ?? [];
          const completedChecklistCount = checklist.filter((item) => item.checked).length;
          const photoCount = job.completion?.photoUrls?.length ?? 0;
          const canOperateJob = canManageCleaningJob(member, user?.uid, job);
          const nextAction = getNextCleaningAction(job, elevatedOperator);

          return (
            <Card key={job.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{job.listingId}</h3>
                  <p className="mt-1 text-xs text-zinc-500">{job.assignedCleanerName ?? "Unassigned cleaner"}</p>
                </div>
                <Badge className="border-white/10 text-zinc-200">{job.status.replaceAll("_", " ")}</Badge>
              </div>

              <p className="mt-3 text-xs text-zinc-500">{formatDateTime(job.scheduledStartAt)} → {formatDateTime(job.scheduledEndAt)}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {job.sameDayTurnover ? <Badge className="border-amber-500/30 text-amber-200">Same day</Badge> : null}
                <Badge className="border-white/10">{job.priority}</Badge>
                {job.completion?.readyForArrival ? <Badge className="border-emerald-500/30 text-emerald-200">Ready for arrival</Badge> : null}
                {requirePhotos ? <Badge className="border-sky-500/30 text-sky-200">Photos required</Badge> : null}
              </div>

              <div className="mt-4 rounded-2xl border border-white/6 bg-white/[0.02] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">Checklist progress</p>
                  <span className="text-xs text-zinc-500">{completedChecklistCount}/{checklist.length || 0} complete</span>
                </div>
                <div className="mt-3 space-y-2">
                  {checklist.length ? checklist.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      disabled={!workspaceId || !user || !canOperateJob || busyKey === `${job.id}:${item.id}`}
                      onClick={async () => {
                        if (!workspaceId || !user || !canOperateJob) return;
                        setFeedback(null);
                        setBusyKey(`${job.id}:${item.id}`);
                        try {
                          await updateCleaningChecklistItem(workspaceId, job, item.id, !item.checked, user.uid, profile?.displayName ?? "Operations");
                          setFeedback(`${job.listingId} checklist updated.`);
                        } catch (error) {
                          setFeedback(error instanceof Error ? error.message : "Unable to update checklist item.");
                        } finally {
                          setBusyKey(null);
                        }
                      }}
                      className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition ${item.checked ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-100" : "border-white/6 bg-black/20 text-zinc-300"}`}
                    >
                      <span>{item.label}</span>
                      <span className="text-xs uppercase tracking-[0.2em]">{item.checked ? "Done" : item.required ? "Required" : "Optional"}</span>
                    </button>
                  )) : <p className="text-sm text-zinc-500">No checklist items attached yet.</p>}
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-white/6 bg-white/[0.02] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">Completion evidence</p>
                  <span className="text-xs text-zinc-500">{photoCount} uploaded</span>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
                  <Input
                    type="file"
                    accept="image/*"
                    disabled={!workspaceId || !user || !canOperateJob || busyKey === `upload:${job.id}`}
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!workspaceId || !user || !file || !canOperateJob) return;
                      setFeedback(null);
                      setBusyKey(`upload:${job.id}`);
                      try {
                        await uploadCleaningCompletionPhoto(workspaceId, job, file, user.uid, profile?.displayName ?? "Operations");
                        setFeedback(`${file.name} uploaded to ${job.listingId}.`);
                      } catch (error) {
                        setFeedback(error instanceof Error ? error.message : "Unable to upload cleaning evidence.");
                      } finally {
                        event.target.value = "";
                        setBusyKey(null);
                      }
                    }}
                  />
                  <div className="rounded-xl border border-white/6 bg-black/20 px-3 py-2 text-xs text-zinc-400">
                    {requirePhotos ? "Upload at least one photo before review." : "Photos are optional for this workspace."}
                  </div>
                </div>
                {(job.completion?.photoUrls?.length ?? 0) > 0 ? (
                  <div className="mt-3 space-y-2">
                    {job.completion?.photoUrls?.map((url, index) => (
                      <a key={`${job.id}:${url}`} href={url} target="_blank" rel="noreferrer" className="block rounded-xl border border-white/6 bg-black/20 px-3 py-2 text-sm text-zinc-200 transition hover:border-white/20 hover:text-white">
                        Completion photo {index + 1}
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="mt-4 grid gap-2 text-xs text-zinc-500">
                <p>Started {job.completion?.startedAt ? formatRelative(job.completion.startedAt) : "not started"}</p>
                <p>Submitted {job.completion?.submittedAt ? formatRelative(job.completion.submittedAt) : "not submitted"}</p>
                <p>Reviewed {job.completion?.reviewedAt ? formatRelative(job.completion.reviewedAt) : "pending review"}</p>
              </div>

              {canOperateJob && nextAction ? (
                <Button
                  type="button"
                  className="mt-5 w-full"
                  disabled={!workspaceId || !user || busyKey === job.id}
                  onClick={async () => {
                    if (!workspaceId || !user) return;
                    setFeedback(null);
                    setBusyKey(job.id);
                    try {
                      await transitionCleaningJob(workspaceId, job, nextAction.nextStatus, user.uid, profile?.displayName ?? "Operations", { requirePhotos });
                      setFeedback(`${job.listingId} moved to ${nextAction.nextStatus.replaceAll("_", " ")}.`);
                    } catch (error) {
                      setFeedback(error instanceof Error ? error.message : "Unable to update cleaning status.");
                    } finally {
                      setBusyKey(null);
                    }
                  }}
                >
                  {busyKey === job.id ? "Saving…" : nextAction.label}
                </Button>
              ) : null}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
