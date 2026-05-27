import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { addDoc, collection, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

const projectId = "onyx-rules-pilot";
const workspaceId = "ws_demo";
let testEnv: RulesTestEnvironment;

async function seedBaseData() {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

    await setDoc(doc(db, "workspaces", workspaceId), {
      name: "Demo Workspace",
      slug: "demo",
      status: "active",
      timezone: "Europe/London",
      currency: "GBP",
    });

    await setDoc(doc(db, "workspaces", workspaceId, "members", "staff-1"), {
      uid: "staff-1",
      workspaceId,
      role: "staff",
      status: "active",
      assignedListingIds: ["listing-1"],
      assignedIssueIds: ["issue-1"],
      permissions: {
        canManageListings: true,
        canManageReservations: true,
        canManageGuests: true,
        canManageCleanings: true,
        canManageMaintenance: true,
        canManageInventory: true,
        canManageSettings: true,
      },
    });

    await setDoc(doc(db, "workspaces", workspaceId, "members", "cleaner-1"), {
      uid: "cleaner-1",
      workspaceId,
      role: "cleaner",
      status: "active",
      assignedListingIds: ["listing-1"],
      assignedIssueIds: [],
      permissions: {
        canManageCleanings: true,
      },
    });

    await setDoc(doc(db, "workspaces", workspaceId, "members", "contractor-1"), {
      uid: "contractor-1",
      workspaceId,
      role: "contractor",
      status: "active",
      assignedListingIds: [],
      assignedIssueIds: ["issue-1"],
      vendorId: "vendor-1",
      permissions: {
        canUploadMaintenanceEvidence: true,
      },
    });

    await setDoc(doc(db, "workspaces", workspaceId, "listings", "listing-1"), {
      workspaceId,
      name: "Listing One",
      status: "active",
      internalCode: "L1",
      propertyType: "flat",
      address: { line1: "1 Demo St", city: "London", country: "UK" },
    });

    await setDoc(doc(db, "workspaces", workspaceId, "guestThreads", "thread-1"), {
      workspaceId,
      listingId: "listing-1",
      reservationId: "reservation-1",
      status: "open",
      guest: { name: "Alex Guest" },
      tags: [],
      lastMessagePreview: "Need late checkout",
      lastMessageKind: "guest_message",
      unreadCounts: { teamUnread: 1 },
      escalation: { hasOpenIssue: false },
    });

    await setDoc(doc(db, "workspaces", workspaceId, "cleaningJobs", "job-1"), {
      workspaceId,
      listingId: "listing-1",
      reservationId: "reservation-1",
      assignedCleanerUid: "cleaner-1",
      status: "assigned",
      checklist: [
        { id: "c1", label: "Kitchen", required: true, checked: false },
      ],
      completion: { photoUrls: [] },
      suppliesNeeded: [],
    });

    await setDoc(doc(db, "workspaces", workspaceId, "maintenanceIssues", "issue-1"), {
      workspaceId,
      listingId: "listing-1",
      reservationId: "reservation-1",
      source: "manual",
      title: "Broken extractor fan",
      status: "in_progress",
      assigneeUid: "contractor-1",
      vendorId: "vendor-1",
      evidence: [],
      attachments: [],
      cost: { currency: "GBP" },
      resolution: {},
    });
  });
}

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
    },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await seedBaseData();
});

after(async () => {
  await testEnv.cleanup();
});

test("unauthenticated users cannot read listings", async () => {
  const db = testEnv.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(db, "workspaces", workspaceId, "listings", "listing-1")));
});

test("staff operator can read assigned listing", async () => {
  const db = testEnv.authenticatedContext("staff-1").firestore();
  const snapshot = await assertSucceeds(getDoc(doc(db, "workspaces", workspaceId, "listings", "listing-1")));
  assert.equal(snapshot.exists(), true);
});

test("cleaner can move own job to in_progress", async () => {
  const db = testEnv.authenticatedContext("cleaner-1").firestore();
  await assertSucceeds(
    updateDoc(doc(db, "workspaces", workspaceId, "cleaningJobs", "job-1"), {
      status: "in_progress",
      updatedByUid: "cleaner-1",
      updatedAt: new Date(),
    })
  );
});

test("cleaner cannot mark own job completed directly", async () => {
  const db = testEnv.authenticatedContext("cleaner-1").firestore();
  await assertFails(
    updateDoc(doc(db, "workspaces", workspaceId, "cleaningJobs", "job-1"), {
      status: "completed",
      updatedByUid: "cleaner-1",
      updatedAt: new Date(),
    })
  );
});

test("contractor can resolve own assigned maintenance issue", async () => {
  const db = testEnv.authenticatedContext("contractor-1").firestore();
  await assertSucceeds(
    updateDoc(doc(db, "workspaces", workspaceId, "maintenanceIssues", "issue-1"), {
      status: "resolved",
      updatedByUid: "contractor-1",
      updatedAt: new Date(),
      resolution: { resolvedAt: new Date(), resolutionNote: "Replaced fan motor" },
      attachments: [{ name: "photo.jpg", url: "https://example.com/photo.jpg" }],
      evidence: ["https://example.com/photo.jpg"],
      cost: { currency: "GBP", final: 95 },
    })
  );
});

test("contractor cannot edit unrelated listing data", async () => {
  const db = testEnv.authenticatedContext("contractor-1").firestore();
  await assertFails(
    updateDoc(doc(db, "workspaces", workspaceId, "listings", "listing-1"), {
      name: "Changed by contractor",
    })
  );
});

test("staff can create internal note that is hidden from guest", async () => {
  const db = testEnv.authenticatedContext("staff-1").firestore();
  const messageRef = collection(db, "workspaces", workspaceId, "guestThreads", "thread-1", "messages");
  await assertSucceeds(
    addDoc(messageRef, {
      workspaceId,
      threadId: "thread-1",
      listingId: "listing-1",
      reservationId: "reservation-1",
      kind: "internal_note",
      sender: { uid: "staff-1", displayName: "Ops", source: "team" },
      body: "Escalate linen request to onsite team.",
      visibleToGuest: false,
      delivery: { state: "sent" },
      createdAt: new Date(),
    })
  );
});

test("staff cannot create guest-visible internal note", async () => {
  const db = testEnv.authenticatedContext("staff-1").firestore();
  const messageRef = collection(db, "workspaces", workspaceId, "guestThreads", "thread-1", "messages");
  await assertFails(
    addDoc(messageRef, {
      workspaceId,
      threadId: "thread-1",
      listingId: "listing-1",
      reservationId: "reservation-1",
      kind: "internal_note",
      sender: { uid: "staff-1", displayName: "Ops", source: "team" },
      body: "This should never be visible externally.",
      visibleToGuest: true,
      delivery: { state: "sent" },
      createdAt: new Date(),
    })
  );
});
