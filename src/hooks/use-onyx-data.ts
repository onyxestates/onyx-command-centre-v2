"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  addDoc,
  arrayUnion,
  collection,
  type CollectionReference,
  doc,
  documentId,
  getDoc,
  type DocumentData,
  limit,
  onSnapshot,
  orderBy,
  query,
  type Query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { getDownloadURL, ref as storageRef, uploadBytes } from "firebase/storage";
import { db, storage } from "@/lib/firebase/client";
import { useAuth } from "@/hooks/use-auth";
import { toDate } from "@/lib/utils/format";
import type {
  ActivityLog,
  CleaningJob,
  DashboardTrendPoint,
  GuestMessage,
  GuestThread,
  InventoryItem,
  Listing,
  MaintenanceIssue,
  NotificationItem,
  QueryState,
  Reservation,
  Vendor,
  WorkspaceMember,
} from "@/types/app";

function useCollectionData<T>(pathSegments: string[], buildQuery?: (ref: CollectionReference<DocumentData>) => Query<DocumentData>, enabled = true): QueryState<T[]> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const path = pathSegments.join("/");
  const buildQueryRef = useRef(buildQuery);

  useEffect(() => {
    buildQueryRef.current = buildQuery;
  }, [buildQuery]);

  useEffect(() => {
    if (!enabled) return;
    const ref = collection(db, path);
    const target = buildQueryRef.current ? buildQueryRef.current(ref) : ref;
    const unsubscribe = onSnapshot(target, (snapshot) => {
      setData(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as T));
      setLoading(false);
      setError(null);
    }, (nextError) => {
      setLoading(false);
      setError(nextError.message || "Unable to load data.");
    });
    return () => unsubscribe();
  }, [enabled, path]);

  return { data, loading: enabled ? loading : false, error };
}

function useDocumentData<T>(pathSegments: string[], enabled = true): QueryState<T | null> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const path = pathSegments.join("/");

  useEffect(() => {
    if (!enabled) return;
    const unsubscribe = onSnapshot(doc(db, path), (snapshot) => {
      setData(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as T) : null);
      setLoading(false);
      setError(null);
    }, (nextError) => {
      setLoading(false);
      setError(nextError.message || "Unable to load document.");
    });
    return () => unsubscribe();
  }, [enabled, path]);

  return { data, loading: enabled ? loading : false, error };
}

function assignedListingIds(member: WorkspaceMember | null) {
  return member?.assignedListingIds?.slice(0, 10) ?? [];
}

function buildListingsQuery(ref: CollectionReference<DocumentData>, member: WorkspaceMember | null) {
  if (member?.role === "cleaner" || member?.role === "contractor") {
    const ids = assignedListingIds(member);
    return ids.length ? query(ref, where(documentId(), "in", ids)) : query(ref, limit(1));
  }
  return query(ref, orderBy("statsSnapshot.revenueMtd", "desc"));
}

function buildReservationsQuery(ref: CollectionReference<DocumentData>, member: WorkspaceMember | null) {
  if (member?.role === "cleaner") {
    const ids = assignedListingIds(member);
    return ids.length ? query(ref, where("listingId", "in", ids), orderBy("checkInAt", "asc")) : query(ref, limit(1));
  }
  if (member?.role === "contractor") {
    return query(ref, where("listingId", "==", "__none__"));
  }
  return query(ref, orderBy("checkInAt", "asc"));
}

function buildThreadsQuery(ref: CollectionReference<DocumentData>, member: WorkspaceMember | null) {
  if (member?.role === "cleaner" || member?.role === "contractor") {
    const ids = assignedListingIds(member);
    return ids.length ? query(ref, where("listingId", "in", ids), orderBy("lastMessageAt", "desc")) : query(ref, limit(1));
  }
  return query(ref, orderBy("lastMessageAt", "desc"));
}

function buildCleaningsQuery(ref: CollectionReference<DocumentData>, member: WorkspaceMember | null, uid?: string | null) {
  if (member?.role === "cleaner" && uid) {
    return query(ref, where("assignedCleanerUid", "==", uid), orderBy("scheduledStartAt", "asc"));
  }
  if (member?.role === "contractor") {
    return query(ref, where("listingId", "==", "__none__"));
  }
  return query(ref, orderBy("scheduledStartAt", "asc"));
}

function buildMaintenanceQuery(ref: CollectionReference<DocumentData>, member: WorkspaceMember | null, uid?: string | null) {
  if (member?.role === "contractor") {
    if (member.vendorId) {
      return query(ref, where("vendorId", "==", member.vendorId), orderBy("createdAt", "desc"));
    }
    if (uid) {
      return query(ref, where("assigneeUid", "==", uid), orderBy("createdAt", "desc"));
    }
  }
  if (member?.role === "cleaner") {
    const ids = assignedListingIds(member);
    return ids.length ? query(ref, where("listingId", "in", ids), orderBy("createdAt", "desc")) : query(ref, limit(1));
  }
  return query(ref, orderBy("createdAt", "desc"));
}

function buildInventoryQuery(ref: CollectionReference<DocumentData>, member: WorkspaceMember | null) {
  if (member?.role === "cleaner") {
    const ids = assignedListingIds(member);
    return ids.length ? query(ref, where("listingId", "in", ids), orderBy("status", "asc"), orderBy("quantity", "asc")) : query(ref, limit(1));
  }
  if (member?.role === "contractor") {
    return query(ref, where("listingId", "==", "__none__"));
  }
  return query(ref, orderBy("status", "asc"), orderBy("quantity", "asc"));
}

export function useWorkspaceCollections() {
  const { workspaceId, member, user } = useAuth();
  const enabled = Boolean(workspaceId && member?.status === "active");

  return {
    workspaceId,
    listings: useCollectionData<Listing>(["workspaces", workspaceId ?? "_", "listings"], (ref) => buildListingsQuery(ref, member), enabled),
    reservations: useCollectionData<Reservation>(["workspaces", workspaceId ?? "_", "reservations"], (ref) => buildReservationsQuery(ref, member), enabled),
    threads: useCollectionData<GuestThread>(["workspaces", workspaceId ?? "_", "guestThreads"], (ref) => buildThreadsQuery(ref, member), enabled),
    cleanings: useCollectionData<CleaningJob>(["workspaces", workspaceId ?? "_", "cleaningJobs"], (ref) => buildCleaningsQuery(ref, member, user?.uid), enabled),
    maintenance: useCollectionData<MaintenanceIssue>(["workspaces", workspaceId ?? "_", "maintenanceIssues"], (ref) => buildMaintenanceQuery(ref, member, user?.uid), enabled),
    vendors: useCollectionData<Vendor>(["workspaces", workspaceId ?? "_", "vendors"], (ref) => query(ref, orderBy("rating", "desc")), enabled && member?.role !== "cleaner"),
    inventory: useCollectionData<InventoryItem>(["workspaces", workspaceId ?? "_", "inventoryItems"], (ref) => buildInventoryQuery(ref, member), enabled),
    notifications: useCollectionData<NotificationItem>(["workspaces", workspaceId ?? "_", "notifications"], (ref) => query(ref, orderBy("createdAt", "desc"), limit(12)), enabled),
    activityLogs: useCollectionData<ActivityLog>(["workspaces", workspaceId ?? "_", "activityLogs"], (ref) => query(ref, orderBy("createdAt", "desc"), limit(20)), enabled),
  };
}

export function useMessages(threadId?: string | null) {
  const { workspaceId, member } = useAuth();
  return useCollectionData<GuestMessage>(["workspaces", workspaceId ?? "_", "guestThreads", threadId ?? "_", "messages"], (ref) => query(ref, orderBy("createdAt", "asc")), Boolean(workspaceId && threadId && member?.status === "active"));
}

export function useListing(listingId?: string | null) {
  const { workspaceId, member } = useAuth();
  return useDocumentData<Listing>(["workspaces", workspaceId ?? "_", "listings", listingId ?? "_"], Boolean(workspaceId && listingId && member?.status === "active"));
}

export function useReservationsForListing(listingId?: string | null) {
  const { workspaceId, member } = useAuth();
  return useCollectionData<Reservation>(["workspaces", workspaceId ?? "_", "reservations"], (ref) => query(ref, where("listingId", "==", listingId), orderBy("checkInAt", "asc")), Boolean(workspaceId && listingId && member?.status === "active"));
}

function getStartOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function getStartOfWeek(date: Date) {
  const next = getStartOfDay(date);
  const day = next.getDay();
  next.setDate(next.getDate() - day + 1);
  return next;
}

export function useDashboardData() {
  const collections = useWorkspaceCollections();
  const derived = useMemo(() => {
    const listings = collections.listings.data;
    const reservations = collections.reservations.data.filter((item) => item.status !== "cancelled" && item.status !== "blocked");
    const cleanings = collections.cleanings.data;
    const maintenance = collections.maintenance.data;
    const threads = collections.threads.data;
    const today = getStartOfDay(new Date());
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const listingCount = Math.max(listings.length, 1);
    const bookedNights = reservations.reduce((sum, item) => {
      const checkIn = toDate(item.checkInAt);
      const checkOut = toDate(item.checkOutAt);
      if (!checkIn || !checkOut) return sum;
      const effectiveStart = checkIn > thirtyDaysAgo ? checkIn : thirtyDaysAgo;
      const effectiveEnd = checkOut < today ? checkOut : today;
      const diff = Math.max(0, Math.ceil((effectiveEnd.getTime() - effectiveStart.getTime()) / 86_400_000));
      return sum + diff;
    }, 0);

    const occupancy = listingCount ? (bookedNights / (listingCount * 30)) * 100 : 0;
    const revenueMtd = reservations.reduce((sum, item) => {
      const checkIn = toDate(item.checkInAt);
      if (!checkIn || checkIn < monthStart) return sum;
      return sum + (item.financials?.grossAmount ?? 0);
    }, 0);

    const arrivalsToday = reservations.filter((item) => {
      const checkIn = toDate(item.checkInAt);
      return checkIn && getStartOfDay(checkIn).getTime() === today.getTime();
    });
    const departuresToday = reservations.filter((item) => {
      const checkOut = toDate(item.checkOutAt);
      return checkOut && getStartOfDay(checkOut).getTime() === today.getTime();
    });

    const trendMap = new Map<string, DashboardTrendPoint>();
    for (let i = 5; i >= 0; i -= 1) {
      const start = getStartOfWeek(new Date(today.getFullYear(), today.getMonth(), today.getDate() - i * 7));
      const label = `${start.toLocaleString("en-GB", { month: "short" })} ${start.getDate()}`;
      trendMap.set(label, { label, revenue: 0, arrivals: 0, departures: 0 });
    }

    reservations.forEach((item) => {
      const checkIn = toDate(item.checkInAt);
      const checkOut = toDate(item.checkOutAt);
      if (checkIn) {
        const start = getStartOfWeek(checkIn);
        const key = `${start.toLocaleString("en-GB", { month: "short" })} ${start.getDate()}`;
        const entry = trendMap.get(key);
        if (entry) {
          entry.arrivals += 1;
          entry.revenue += item.financials?.grossAmount ?? 0;
        }
      }
      if (checkOut) {
        const start = getStartOfWeek(checkOut);
        const key = `${start.toLocaleString("en-GB", { month: "short" })} ${start.getDate()}`;
        const entry = trendMap.get(key);
        if (entry) entry.departures += 1;
      }
    });

    const liveUpdatedAt = [
      ...collections.activityLogs.data.map((item) => toDate(item.createdAt)),
      ...maintenance.map((item) => toDate(item.updatedAt ?? item.createdAt)),
      ...cleanings.map((item) => toDate(item.updatedAt ?? item.createdAt)),
      ...threads.map((item) => toDate(item.lastMessageAt)),
      ...reservations.map((item) => toDate(item.updatedAt ?? item.createdAt)),
    ].filter((value): value is Date => Boolean(value)).sort((a, b) => b.getTime() - a.getTime())[0] ?? null;

    return {
      occupancy,
      revenueMtd,
      checkInsCount: arrivalsToday.length,
      checkOutsCount: departuresToday.length,
      openIssuesCount: maintenance.filter((item) => ["open", "triaged", "scheduled", "in_progress"].includes(item.status)).length,
      unreadThreadsCount: threads.filter((item) => (item.unreadCounts?.teamUnread ?? 0) > 0).length,
      pendingCleaningsCount: cleanings.filter((item) => ["pending", "assigned", "in_progress", "review", "overdue"].includes(item.status)).length,
      arrivalsToday,
      departuresToday,
      urgentIssues: maintenance.filter((item) => item.severity === "urgent" || item.severity === "high").slice(0, 5),
      overdueCleanings: cleanings.filter((item) => item.status === "overdue" || item.status === "review").slice(0, 5),
      trend: Array.from(trendMap.values()),
      liveUpdatedAt,
    };
  }, [collections.activityLogs.data, collections.cleanings.data, collections.listings.data, collections.maintenance.data, collections.reservations.data, collections.threads.data]);

  return { ...collections, derived };
}

async function logActivity(workspaceId: string, actorUid: string, actorName: string, action: string, summary: string, entity: { collection: string; id: string; label?: string }) {
  await addDoc(collection(db, "workspaces", workspaceId, "activityLogs"), {
    workspaceId,
    actorUid,
    actorName,
    action,
    summary,
    entity,
    createdAt: serverTimestamp(),
  });
}

export async function sendThreadMessage(
  workspaceId: string,
  threadId: string,
  listingId: string,
  reservationId: string,
  senderUid: string,
  senderName: string,
  body: string,
  kind: GuestMessage["kind"] = "team_message",
  visibleToGuest = true
) {
  await addDoc(collection(db, "workspaces", workspaceId, "guestThreads", threadId, "messages"), {
    workspaceId,
    threadId,
    listingId,
    reservationId,
    kind,
    sender: { uid: senderUid, displayName: senderName, source: "team" },
    body,
    visibleToGuest,
    delivery: { state: "sent", sentAt: serverTimestamp() },
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, "workspaces", workspaceId, "guestThreads", threadId), {
    lastMessageAt: serverTimestamp(),
    lastMessagePreview: body,
    lastMessageKind: kind,
    "unreadCounts.teamUnread": 0,
    updatedAt: serverTimestamp(),
  });
  await logActivity(workspaceId, senderUid, senderName, kind === "internal_note" ? "internal_note_added" : "message_sent", `${kind === "internal_note" ? "Added internal note to" : "Sent guest response in"} thread ${threadId}`, { collection: "guestThreads", id: threadId, label: listingId });
}

export async function sendTeamMessage(workspaceId: string, threadId: string, listingId: string, reservationId: string, senderUid: string, senderName: string, body: string) {
  return sendThreadMessage(workspaceId, threadId, listingId, reservationId, senderUid, senderName, body, "team_message", true);
}

export async function markGuestThreadRead(workspaceId: string, threadId: string) {
  await updateDoc(doc(db, "workspaces", workspaceId, "guestThreads", threadId), {
    "unreadCounts.teamUnread": 0,
    updatedAt: serverTimestamp(),
  });
}

export async function updateGuestThreadStatus(workspaceId: string, thread: GuestThread, nextStatus: GuestThread["status"], actorUid: string, actorName: string) {
  await updateDoc(doc(db, "workspaces", workspaceId, "guestThreads", thread.id), {
    status: nextStatus,
    updatedAt: serverTimestamp(),
    updatedByUid: actorUid,
  });
  await logActivity(workspaceId, actorUid, actorName, "guest_thread_status_updated", `${thread.guest.name} thread moved to ${nextStatus}`, { collection: "guestThreads", id: thread.id, label: thread.listingId });
}

export async function updateReservationStatus(workspaceId: string, reservationId: string, nextStatus: Reservation["status"], actorUid: string, actorName: string) {
  const reservationRef = doc(db, "workspaces", workspaceId, "reservations", reservationId);
  const reservationSnapshot = await getDoc(reservationRef);
  if (!reservationSnapshot.exists()) return;
  const reservation = reservationSnapshot.data() as Reservation;
  const batch = writeBatch(db);
  batch.update(reservationRef, { status: nextStatus, updatedAt: serverTimestamp(), updatedByUid: actorUid });

  if (nextStatus === "checked_out" && reservation.operational?.cleaningJobId) {
    batch.set(doc(db, "workspaces", workspaceId, "cleaningJobs", reservation.operational.cleaningJobId), {
      status: "pending",
      updatedAt: serverTimestamp(),
      updatedByUid: actorUid,
    }, { merge: true });
  }

  if (nextStatus === "ready_for_check_in" && reservation.operational?.cleaningJobId) {
    batch.set(doc(db, "workspaces", workspaceId, "cleaningJobs", reservation.operational.cleaningJobId), {
      status: "completed",
      "completion.readyForArrival": true,
      updatedAt: serverTimestamp(),
      updatedByUid: actorUid,
    }, { merge: true });
  }

  if (reservation.operational?.guestThreadId) {
    batch.set(doc(db, "workspaces", workspaceId, "guestThreads", reservation.operational.guestThreadId), {
      status: nextStatus === "checked_out" ? "resolved" : "open",
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }

  await batch.commit();
  await logActivity(workspaceId, actorUid, actorName, "reservation_status_updated", `${reservation.guest.primaryName} moved to ${nextStatus.replaceAll("_", " ")}`, { collection: "reservations", id: reservationId, label: reservation.listingId });
}

export async function updateCleaningChecklistItem(workspaceId: string, job: CleaningJob, itemId: string, checked: boolean, actorUid: string, actorName: string) {
  const checklist = (job.checklist ?? []).map((item) => (item.id === itemId ? { ...item, checked } : item));
  await updateDoc(doc(db, "workspaces", workspaceId, "cleaningJobs", job.id), {
    checklist,
    updatedAt: serverTimestamp(),
    updatedByUid: actorUid,
  });
  await logActivity(workspaceId, actorUid, actorName, "cleaning_checklist_updated", `${job.listingId} checklist ${checked ? "completed" : "re-opened"}`, { collection: "cleaningJobs", id: job.id, label: job.listingId });
}

export async function uploadCleaningCompletionPhoto(workspaceId: string, job: CleaningJob, file: File, actorUid: string, actorName: string) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image uploads are supported for cleaning completion evidence.");
  }

  const storagePath = `workspaces/${workspaceId}/cleanings/${job.listingId}/${job.id}/${Date.now()}-${file.name}`;
  const uploaded = await uploadBytes(storageRef(storage, storagePath), file, { contentType: file.type });
  const url = await getDownloadURL(uploaded.ref);
  await updateDoc(doc(db, "workspaces", workspaceId, "cleaningJobs", job.id), {
    "completion.photoUrls": arrayUnion(url),
    updatedAt: serverTimestamp(),
    updatedByUid: actorUid,
  });
  await logActivity(workspaceId, actorUid, actorName, "cleaning_evidence_uploaded", `Uploaded completion photo for ${job.listingId}`, { collection: "cleaningJobs", id: job.id, label: file.name });
  return url;
}

export async function transitionCleaningJob(
  workspaceId: string,
  job: CleaningJob,
  nextStatus: CleaningJob["status"],
  actorUid: string,
  actorName: string,
  options?: { requirePhotos?: boolean }
) {
  const batch = writeBatch(db);
  const jobRef = doc(db, "workspaces", workspaceId, "cleaningJobs", job.id);
  const payload: Record<string, unknown> = { status: nextStatus, updatedAt: serverTimestamp(), updatedByUid: actorUid };
  const requiredChecklistIncomplete = (job.checklist ?? []).some((item) => item.required && !item.checked);
  const photoCount = job.completion?.photoUrls?.length ?? 0;

  if (nextStatus === "review") {
    if (requiredChecklistIncomplete) {
      throw new Error("All required checklist items must be completed before submission for review.");
    }
    if (options?.requirePhotos && photoCount === 0) {
      throw new Error("Upload at least one cleaning photo before submitting this task for review.");
    }
  }

  if (nextStatus === "in_progress") payload["completion.startedAt"] = serverTimestamp();
  if (nextStatus === "review") {
    payload["completion.submittedAt"] = serverTimestamp();
    payload["completion.readyForArrival"] = false;
  }
  if (nextStatus === "completed") {
    payload["completion.reviewedAt"] = serverTimestamp();
    payload["completion.reviewedByUid"] = actorUid;
    payload["completion.readyForArrival"] = true;
  }

  batch.update(jobRef, payload);

  if (nextStatus === "completed" && job.reservationId) {
    const reservationRef = doc(db, "workspaces", workspaceId, "reservations", job.reservationId);
    const reservationSnapshot = await getDoc(reservationRef);
    if (reservationSnapshot.exists()) {
      const reservation = reservationSnapshot.data() as Reservation;
      if (!["cancelled", "blocked", "checked_in", "checked_out"].includes(reservation.status)) {
        batch.set(reservationRef, {
          status: "ready_for_check_in",
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }
    }
  }

  await batch.commit();
  await logActivity(workspaceId, actorUid, actorName, "cleaning_status_updated", `${job.listingId} cleaning moved to ${nextStatus.replaceAll("_", " ")}`, { collection: "cleaningJobs", id: job.id, label: job.listingId });
}

export async function uploadMaintenanceTicketEvidence(workspaceId: string, issueId: string, file: File, actorUid: string, actorName: string) {
  const isSupportedFile = file.type.startsWith("image/") || file.type === "application/pdf";
  if (!isSupportedFile) {
    throw new Error("Only images and PDF evidence files are supported for maintenance uploads.");
  }
  const storagePath = `workspaces/${workspaceId}/maintenance/${issueId}/${Date.now()}-${file.name}`;
  const uploaded = await uploadBytes(storageRef(storage, storagePath), file, { contentType: file.type });
  const url = await getDownloadURL(uploaded.ref);
  await updateDoc(doc(db, "workspaces", workspaceId, "maintenanceIssues", issueId), {
    evidence: arrayUnion(url),
    attachments: arrayUnion({ name: file.name, url, uploadedAt: new Date(), uploadedByUid: actorUid }),
    updatedAt: serverTimestamp(),
  });
  await logActivity(workspaceId, actorUid, actorName, "maintenance_evidence_uploaded", `Uploaded evidence for issue ${issueId}`, { collection: "maintenanceIssues", id: issueId, label: file.name });
  return url;
}

export async function advanceMaintenanceIssueStatus(workspaceId: string, issue: MaintenanceIssue, nextStatus: MaintenanceIssue["status"], actorUid: string, actorName: string) {
  const payload: Record<string, unknown> = { status: nextStatus, updatedAt: serverTimestamp() };
  if (nextStatus === "resolved" || nextStatus === "closed") payload["resolution.resolvedAt"] = serverTimestamp();
  payload.updatedByUid = actorUid;
  await updateDoc(doc(db, "workspaces", workspaceId, "maintenanceIssues", issue.id), payload);
  await logActivity(workspaceId, actorUid, actorName, "maintenance_status_updated", `${issue.title} moved to ${nextStatus.replaceAll("_", " ")}`, { collection: "maintenanceIssues", id: issue.id, label: issue.listingId });
}

function deriveReservationLifecycleStatus(reservation: Reservation, linkedCleaning?: CleaningJob | null): Reservation["status"] {
  if (["cancelled", "blocked"].includes(reservation.status)) return reservation.status;

  const now = new Date();
  const checkInAt = toDate(reservation.checkInAt);
  const checkOutAt = toDate(reservation.checkOutAt);

  if (!checkInAt || !checkOutAt) return reservation.status;
  if (now >= checkOutAt) return "checked_out";
  if (now >= checkInAt) return "checked_in";
  if (linkedCleaning?.status === "completed" && linkedCleaning.completion?.readyForArrival !== false) return "ready_for_check_in";
  return "confirmed";
}

export async function syncReservationLifecycle(workspaceId: string, reservation: Reservation, linkedCleaning: CleaningJob | null, actorUid: string, actorName: string) {
  const nextStatus = deriveReservationLifecycleStatus(reservation, linkedCleaning);
  if (nextStatus === reservation.status) return nextStatus;
  await updateReservationStatus(workspaceId, reservation.id, nextStatus, actorUid, actorName);
  return nextStatus;
}

export async function syncAllReservationStatuses(workspaceId: string, reservations: Reservation[], cleanings: CleaningJob[], actorUid: string, actorName: string) {
  const cleaningMap = new Map(cleanings.map((job) => [job.id, job]));
  const results: Array<{ reservationId: string; nextStatus: Reservation["status"] }> = [];

  for (const reservation of reservations) {
    const linkedCleaning = reservation.operational?.cleaningJobId ? cleaningMap.get(reservation.operational.cleaningJobId) ?? null : null;
    const nextStatus = await syncReservationLifecycle(workspaceId, reservation, linkedCleaning, actorUid, actorName);
    results.push({ reservationId: reservation.id, nextStatus });
  }

  return results;
}

export function useUnreadNotifications() {
  const { workspaceId, user, member } = useAuth();
  return useCollectionData<NotificationItem>(["workspaces", workspaceId ?? "_", "notifications"], (ref) => query(ref, where("recipientUid", "==", user?.uid ?? "_"), where("readAt", "==", null), orderBy("createdAt", "desc")), Boolean(workspaceId && user && member?.status === "active"));
}
