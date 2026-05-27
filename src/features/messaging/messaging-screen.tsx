"use client";

import { useEffect, useMemo, useState } from "react";
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
import { markGuestThreadRead, sendThreadMessage, updateGuestThreadStatus, useMessages, useWorkspaceCollections } from "@/hooks/use-onyx-data";
import { formatRelative } from "@/lib/utils/format";
import { hasPermission } from "@/lib/utils/permissions";
import type { GuestThread } from "@/types/app";

const statusOptions: GuestThread["status"][] = ["open", "pending", "resolved"];

export function MessagingScreen() {
  const { member, user, profile, workspaceId } = useAuth();
  const { threads } = useWorkspaceCollections();
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [composerMode, setComposerMode] = useState<"team_message" | "internal_note">("team_message");
  const [draft, setDraft] = useState("Hi there — we have logged your request and will confirm the update shortly.");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const activeThread = useMemo(() => threads.data.find((thread) => thread.id === selectedThreadId) ?? threads.data[0] ?? null, [selectedThreadId, threads.data]);
  const messages = useMessages(activeThread?.id);

  useEffect(() => {
    if (!workspaceId || !activeThread || (activeThread.unreadCounts?.teamUnread ?? 0) === 0) return;
    void markGuestThreadRead(workspaceId, activeThread.id);
  }, [activeThread, workspaceId]);

  if (!hasPermission(member, "canManageGuests")) return <AccessState />;
  if (threads.loading) return <LoadingState />;
  if (threads.error) return <ErrorState message={threads.error} />;
  if (!activeThread) return <EmptyState title="No guest threads" description="Once guest messaging is seeded, your inbox view will appear here." />;

  return (
    <div className="space-y-6">
      <PageHeader title="Messaging" description="Unified guest inbox for rapid responses, issue escalation, and handoff visibility." />

      {feedback ? <Card className="border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-100">{feedback}</Card> : null}

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="font-semibold">Open inbox</h3>
            <Badge className="border-white/10 text-zinc-300">{threads.data.length} threads</Badge>
          </div>
          <div className="space-y-3">
            {threads.data.map((thread) => {
              const active = thread.id === activeThread.id;
              return (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => {
                    setSelectedThreadId(thread.id);
                    setFeedback(null);
                  }}
                  className={`w-full rounded-xl border p-3 text-left transition ${active ? "border-[var(--gold)] bg-[var(--gold-soft)]/20" : "border-white/6 bg-white/[0.02] hover:border-white/20"}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{thread.guest.name}</p>
                    <span className="text-xs text-zinc-500">{thread.unreadCounts?.teamUnread ?? 0}</span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">{thread.listingId} • {thread.status}</p>
                  <p className="mt-2 truncate text-xs text-zinc-400">{thread.lastMessagePreview ?? "No recent preview"}</p>
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex flex-col gap-4 border-b border-white/6 pb-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h3 className="font-semibold">{activeThread.guest.name}</h3>
              <p className="text-xs text-zinc-500">{activeThread.listingId} • updated {formatRelative(activeThread.lastMessageAt)}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge className="border-white/10 text-zinc-200">{activeThread.status}</Badge>
                {activeThread.tags?.map((tag) => <Badge key={tag} className="border-white/10 text-zinc-300">{tag}</Badge>)}
                {activeThread.escalation?.hasOpenIssue ? <Badge className="border-amber-500/30 text-amber-200">Open issue linked</Badge> : null}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((status) => (
                <Button
                  key={status}
                  type="button"
                  className="px-3 py-2 text-xs"
                  disabled={!workspaceId || !user || busyKey === `status:${status}` || activeThread.status === status}
                  onClick={async () => {
                    if (!workspaceId || !user) return;
                    setBusyKey(`status:${status}`);
                    setFeedback(null);
                    try {
                      await updateGuestThreadStatus(workspaceId, activeThread, status, user.uid, profile?.displayName ?? "Operations");
                      setFeedback(`${activeThread.guest.name} thread moved to ${status}.`);
                    } catch (error) {
                      setFeedback(error instanceof Error ? error.message : "Unable to update guest thread status.");
                    } finally {
                      setBusyKey(null);
                    }
                  }}
                >
                  {busyKey === `status:${status}` ? "Saving…" : status}
                </Button>
              ))}
            </div>
          </div>

          <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto pr-1">
            {messages.loading ? (
              <LoadingState />
            ) : messages.error ? (
              <ErrorState message={messages.error} />
            ) : messages.data.map((message) => {
              const isInternal = message.kind === "internal_note";
              return (
                <div key={message.id} className={`rounded-xl border p-3 ${isInternal ? "border-sky-500/20 bg-sky-500/5" : "border-white/6 bg-white/[0.02]"}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
                    <span>{message.sender.displayName ?? message.sender.source}</span>
                    <div className="flex items-center gap-2">
                      <Badge className="border-white/10 text-zinc-300">{message.kind.replaceAll("_", " ")}</Badge>
                      <span>{formatRelative(message.createdAt)}</span>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-zinc-200">{message.body}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-5 space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button type="button" className={`px-3 py-2 text-xs ${composerMode === "team_message" ? "" : "bg-white/10 text-white hover:bg-white/20"}`} onClick={() => setComposerMode("team_message")}>
                Guest reply
              </Button>
              <Button type="button" className={`px-3 py-2 text-xs ${composerMode === "internal_note" ? "" : "bg-white/10 text-white hover:bg-white/20"}`} onClick={() => setComposerMode("internal_note")}>
                Internal note
              </Button>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={composerMode === "internal_note" ? "Add an internal handoff note" : "Reply to the guest"} />
              <Button
                type="button"
                disabled={!workspaceId || !user || !draft.trim() || busyKey === "send"}
                onClick={async () => {
                  if (!workspaceId || !user || !activeThread || !draft.trim()) return;
                  setBusyKey("send");
                  setFeedback(null);
                  try {
                    await sendThreadMessage(
                      workspaceId,
                      activeThread.id,
                      activeThread.listingId,
                      activeThread.reservationId,
                      user.uid,
                      profile?.displayName ?? "Operations",
                      draft.trim(),
                      composerMode,
                      composerMode === "team_message"
                    );
                    setDraft("");
                    setFeedback(composerMode === "internal_note" ? "Internal note saved." : "Guest reply sent.");
                  } catch (error) {
                    setFeedback(error instanceof Error ? error.message : "Unable to send message.");
                  } finally {
                    setBusyKey(null);
                  }
                }}
              >
                {busyKey === "send" ? "Sending…" : composerMode === "internal_note" ? "Save note" : "Send"}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
