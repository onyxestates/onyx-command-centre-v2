import { readFileSync } from "node:fs";
import { after, before, beforeEach, test } from "node:test";
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, setDoc } from "firebase/firestore";
import { ref, uploadString } from "firebase/storage";

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
        canManageMaintenance: true,
        canManageListings: true,
        canManageCleanings: true,
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

    await setDoc(doc(db, "workspaces", workspaceId, "cleaningJobs", "job-1"), {
      workspaceId,
      listingId: "listing-1",
      reservationId: "reservation-1",
      assignedCleanerUid: "cleaner-1",
      status: "assigned",
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
    });
  });
}

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
    },
    storage: {
      rules: readFileSync("storage.rules", "utf8"),
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

test("cleaner can upload evidence for assigned cleaning job", async () => {
  const storage = testEnv.authenticatedContext("cleaner-1").storage();
  const uploadRef = ref(storage, `workspaces/${workspaceId}/cleanings/listing-1/job-1/proof.jpg`);
  await assertSucceeds(uploadString(uploadRef, "image-bytes", "raw", { contentType: "image/jpeg" }));
});

test("cleaner cannot upload evidence for unrelated listing", async () => {
  const storage = testEnv.authenticatedContext("cleaner-1").storage();
  const uploadRef = ref(storage, `workspaces/${workspaceId}/cleanings/listing-2/job-1/proof.jpg`);
  await assertFails(uploadString(uploadRef, "image-bytes", "raw", { contentType: "image/jpeg" }));
});

test("contractor can upload maintenance evidence for assigned issue", async () => {
  const storage = testEnv.authenticatedContext("contractor-1").storage();
  const uploadRef = ref(storage, `workspaces/${workspaceId}/maintenance/issue-1/report.pdf`);
  await assertSucceeds(uploadString(uploadRef, "pdf-bytes", "raw", { contentType: "application/pdf" }));
});

test("unauthenticated upload is rejected", async () => {
  const storage = testEnv.unauthenticatedContext().storage();
  const uploadRef = ref(storage, `workspaces/${workspaceId}/maintenance/issue-1/report.pdf`);
  await assertFails(uploadString(uploadRef, "pdf-bytes", "raw", { contentType: "application/pdf" }));
});
