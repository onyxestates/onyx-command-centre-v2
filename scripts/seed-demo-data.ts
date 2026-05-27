import "dotenv/config";
import * as admin from "firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

const serviceAccountPath = path.join(process.cwd(), "scripts", "serviceAccountKey.json");
if (!admin.apps.length) {
  if (fs.existsSync(serviceAccountPath)) {
    admin.initializeApp({ credential: admin.credential.cert(JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"))) });
  } else {
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
  }
}

const db = admin.firestore();
const auth = admin.auth();
const WS = "ws_northbridge_demo";
const users = [
  { uid: "usr_daniel_mercer", email: "daniel@northbridgestays.com", displayName: "Daniel Mercer", role: "admin", assignedListingIds: [], assignedIssueIds: [] },
  { uid: "usr_sophie_hayes", email: "sophie@northbridgestays.com", displayName: "Sophie Hayes", role: "staff", assignedListingIds: [], assignedIssueIds: [] },
  { uid: "usr_elena_reyes", email: "elena.reyes@northbridgestays.com", displayName: "Elena Reyes", role: "cleaner", assignedListingIds: ["lst_penthouse_north", "lst_city_loft_02"], assignedIssueIds: [] },
  { uid: "usr_marco_silva", email: "marco.silva@northbridgestays.com", displayName: "Marco Silva", role: "cleaner", assignedListingIds: ["lst_soho_residence", "lst_shoreditch_loft"], assignedIssueIds: [] },
  { uid: "usr_marcus_lee", email: "marcus.lee@northbridgestays.com", displayName: "Marcus Lee", role: "contractor", assignedListingIds: ["lst_penthouse_north", "lst_soho_residence", "lst_harbour_view_suite"], assignedIssueIds: ["iss_pn_wine_fridge", "iss_sl_balcony_light"] }
] as const;
const password = process.env.ONYX_DEMO_PASSWORD ?? "OnyxDemo!2026";
const ts = (value: string) => Timestamp.fromDate(new Date(value));

async function ensureAuth() {
  for (const user of users) {
    try { await auth.getUser(user.uid); }
    catch {
      await auth.createUser({ uid: user.uid, email: user.email, displayName: user.displayName, password });
    }
  }
}

async function seed() {
  await ensureAuth();
  const batch = db.batch();
  batch.set(db.doc(`workspaces/${WS}`), {
    name: "Northbridge Stays", slug: "northbridge-stays", status: "active", timezone: "Europe/London", currency: "GBP", country: "GB",
    settings: { defaultCheckInTime: "16:00", defaultCheckOutTime: "11:00", requireCleaningPhotos: true, requireDamageReportOnFlag: true },
    onboarding: { completed: true, step: "done" }, createdAt: ts("2026-05-01T09:00:00Z"), createdByUid: users[0].uid, updatedAt: ts("2026-05-18T09:00:00Z"), updatedByUid: users[0].uid
  }, { merge: true });

  users.forEach((user, index) => {
    batch.set(db.doc(`users/${user.uid}`), { displayName: user.displayName, email: user.email, defaultWorkspaceId: WS, preferences: { darkMode: true, emailNotifications: true, pushNotifications: true, timezone: "Europe/London" }, createdAt: ts(`2026-05-0${index + 1}T08:00:00Z`), updatedAt: ts("2026-05-18T09:00:00Z") }, { merge: true });
    batch.set(db.doc(`workspaces/${WS}/members/${user.uid}`), { uid: user.uid, role: user.role, status: "active", displayName: user.displayName, email: user.email, assignedListingIds: user.assignedListingIds, assignedIssueIds: user.assignedIssueIds, permissions: { canViewAnalytics: ["admin", "staff"].includes(user.role), canManageTeam: user.role === "admin", canManageListings: ["admin", "staff"].includes(user.role), canManageReservations: ["admin", "staff"].includes(user.role), canManageGuests: ["admin", "staff"].includes(user.role), canManageCleanings: ["admin", "staff", "cleaner"].includes(user.role), canManageMaintenance: ["admin", "staff", "contractor"].includes(user.role), canManageInventory: ["admin", "staff"].includes(user.role), canManageSettings: user.role === "admin", canUploadMaintenanceEvidence: ["admin", "staff", "contractor"].includes(user.role) }, createdAt: ts("2026-05-01T09:10:00Z"), createdByUid: users[0].uid, updatedAt: ts("2026-05-18T09:00:00Z"), updatedByUid: users[0].uid }, { merge: true });
  });

  const listings = [
    ["lst_penthouse_north", "Penthouse North", "PN-01", "London", 18200, 84],
    ["lst_soho_residence", "Soho Residence", "SR-02", "London", 15400, 79],
    ["lst_harbour_view_suite", "Harbour View Suite", "HV-03", "London", 13100, 74],
    ["lst_city_loft_02", "City Loft 02", "CL-04", "Manchester", 11200, 68],
    ["lst_shoreditch_loft", "Shoreditch Loft", "SL-05", "London", 14600, 82]
  ] as const;
  listings.forEach(([id, name, code, city, revenue, occupancy], idx) => batch.set(db.doc(`workspaces/${WS}/listings/${id}`), {
    workspaceId: WS, status: idx === 3 ? "attention" : "active", name, internalCode: code, propertyType: "Apartment", address: { line1: `${idx + 10} Market Street`, city, postcode: `E1 ${idx + 1}AA`, country: "GB" }, pricing: { baseRate: 240, cleaningFee: 65 }, photos: { coverUrl: `https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&sig=${idx}` }, operations: { preferredCleanerUid: idx % 2 === 0 ? users[2].uid : users[3].uid, laundryProvider: "Luxe Linen Co." }, statsSnapshot: { revenueMtd: revenue, occupancy30d: occupancy, adr30d: 260, revpar30d: 210, nextCheckInAt: ts(`2026-05-2${idx}T15:00:00Z`), nextCheckOutAt: ts(`2026-05-2${idx}T10:00:00Z`) }, flags: { attentionRequired: idx === 3, lowStock: idx === 1, maintenanceOpen: idx === 0 }, createdAt: ts("2026-05-01T11:00:00Z"), createdByUid: users[1].uid, updatedAt: ts("2026-05-18T09:00:00Z"), updatedByUid: users[1].uid }, { merge: true }));

  const reservations = [
    ["res_oliver_grant_pn", "lst_penthouse_north", "Oliver Grant", "confirmed", "airbnb", "2026-05-20T15:00:00Z", "2026-05-24T10:00:00Z", 2150],
    ["res_amelia_brooks_sr", "lst_soho_residence", "Amelia Brooks", "checked_in", "vrbo", "2026-05-18T15:00:00Z", "2026-05-21T10:00:00Z", 1680],
    ["res_henry_wright_sl", "lst_shoreditch_loft", "Henry Wright", "confirmed", "airbnb", "2026-05-19T15:00:00Z", "2026-05-22T10:00:00Z", 1490],
    ["res_maya_thompson_cl", "lst_city_loft_02", "Maya Thompson", "confirmed", "manual", "2026-05-22T15:00:00Z", "2026-05-26T10:00:00Z", 1320]
  ] as const;
  reservations.forEach(([id, listingId, guest, status, source, checkInAt, checkOutAt, grossAmount]) => batch.set(db.doc(`workspaces/${WS}/reservations/${id}`), { workspaceId: WS, listingId, status, source, guest: { primaryName: guest, email: `${guest.toLowerCase().replace(/ /g, ".")}@example.com`, adults: 2 }, checkInAt: ts(checkInAt), checkOutAt: ts(checkOutAt), financials: { grossAmount, cleaningFee: 65, taxes: 120, netAmount: grossAmount - 185, currency: "GBP" }, operational: { cleaningJobId: id === "res_oliver_grant_pn" ? "cln_pn_turnover" : id === "res_henry_wright_sl" ? "cln_sl_review" : id === "res_amelia_brooks_sr" ? "cln_sr_complete" : null, guestThreadId: id === "res_oliver_grant_pn" ? "thr_oliver_grant_pn" : id === "res_henry_wright_sl" ? "thr_henry_wright_sl" : null }, createdAt: ts("2026-05-12T09:00:00Z"), createdByUid: users[1].uid, updatedAt: ts("2026-05-18T09:00:00Z"), updatedByUid: users[1].uid }, { merge: true }));

  const threads = [
    ["thr_oliver_grant_pn", "res_oliver_grant_pn", "lst_penthouse_north", "Oliver Grant", "Could we arrange a slightly earlier check-in?", 1],
    ["thr_henry_wright_sl", "res_henry_wright_sl", "lst_shoreditch_loft", "Henry Wright", "The balcony light appears to be flickering.", 2]
  ] as const;
  threads.forEach(([id, reservationId, listingId, guestName, preview, unread]) => {
    batch.set(db.doc(`workspaces/${WS}/guestThreads/${id}`), { workspaceId: WS, listingId, reservationId, status: "open", guest: { name: guestName, email: `${guestName.toLowerCase().replace(/ /g, ".")}@example.com` }, lastMessageAt: ts("2026-05-18T08:30:00Z"), lastMessagePreview: preview, lastMessageKind: "guest_message", unreadCounts: { guestVisible: 0, teamUnread: unread }, escalation: { hasOpenIssue: guestName === "Henry Wright" } }, { merge: true });
    batch.set(db.doc(`workspaces/${WS}/guestThreads/${id}/messages/msg_1`), { workspaceId: WS, threadId: id, reservationId, listingId, kind: "guest_message", sender: { source: "guest", displayName: guestName }, body: preview, visibleToGuest: true, createdAt: ts("2026-05-18T08:30:00Z") }, { merge: true });
  });

  const cleaningJobs = [
    ["cln_pn_turnover", "lst_penthouse_north", "res_oliver_grant_pn", "assigned", "premium", users[2].uid, users[2].displayName],
    ["cln_sl_review", "lst_shoreditch_loft", "res_henry_wright_sl", "review", "high", users[3].uid, users[3].displayName],
    ["cln_sr_complete", "lst_soho_residence", "res_amelia_brooks_sr", "completed", "standard", users[3].uid, users[3].displayName]
  ] as const;
  cleaningJobs.forEach(([id, listingId, reservationId, status, priority, cleanerUid, cleanerName], idx) => batch.set(db.doc(`workspaces/${WS}/cleaningJobs/${id}`), { workspaceId: WS, listingId, reservationId, status, priority, assignedCleanerUid: cleanerUid, assignedCleanerName: cleanerName, sameDayTurnover: idx === 0, scheduledStartAt: ts(`2026-05-1${idx + 8}T11:00:00Z`), scheduledEndAt: ts(`2026-05-1${idx + 8}T13:00:00Z`), checklist: [{ id: "linen", label: "Linen replaced", required: true, checked: idx > 0 }, { id: "photo", label: "Arrival photos", required: true, checked: status === "completed" }, { id: "amenities", label: "Amenities restocked", required: true, checked: status !== "assigned" }], completion: status === "completed" ? { startedAt: ts("2026-05-18T11:05:00Z"), submittedAt: ts("2026-05-18T12:35:00Z"), reviewedAt: ts("2026-05-18T12:50:00Z"), reviewedByUid: users[1].uid, readyForArrival: true, photoUrls: [] } : status === "review" ? { startedAt: ts("2026-05-18T11:05:00Z"), submittedAt: ts("2026-05-18T12:35:00Z"), photoUrls: [] } : {}, createdAt: ts("2026-05-16T09:00:00Z"), createdByUid: users[1].uid, updatedAt: ts("2026-05-18T09:00:00Z"), updatedByUid: users[1].uid }, { merge: true }));

  const issues = [
    ["iss_pn_wine_fridge", "lst_penthouse_north", "Wine fridge not cooling", "appliance", "high", "scheduled", "vnd_coolcurrent_hvac", "Cool Current HVAC"],
    ["iss_sl_balcony_light", "lst_shoreditch_loft", "Balcony wall light flickering", "electrical", "medium", "open", null, null]
  ] as const;
  issues.forEach(([id, listingId, title, category, severity, status, vendorId, vendorName]) => batch.set(db.doc(`workspaces/${WS}/maintenanceIssues/${id}`), { workspaceId: WS, listingId, source: "inspection", title, category, severity, status, assigneeUid: users[4].uid, assigneeName: users[4].displayName, vendorId, vendorName, evidence: [], attachments: [], cost: { estimate: severity === "high" ? 280 : 65, currency: "GBP" }, createdAt: ts("2026-05-17T09:00:00Z"), createdByUid: users[4].uid, updatedAt: ts("2026-05-18T09:00:00Z"), updatedByUid: users[4].uid }, { merge: true }));

  const vendors = [
    ["vnd_eastside_plumbing", "Eastside Plumbing", "plumbing", "+44 20 7946 0101", 4.8],
    ["vnd_coolcurrent_hvac", "Cool Current HVAC", "hvac", "+44 20 7946 0102", 4.6],
    ["vnd_luxe_linen", "Luxe Linen Co.", "linen", "+44 20 7946 0103", 4.9]
  ] as const;
  vendors.forEach(([id, name, category, phone, rating]) => batch.set(db.doc(`workspaces/${WS}/vendors/${id}`), { workspaceId: WS, name, category, phone, preferred: true, status: "active", rating, notes: `${name} is approved for premium service recovery and rapid dispatch.` }, { merge: true }));

  const inventory = [
    ["inv_pn_towels", "lst_penthouse_north", "Bath towels", "linen", 12, 6, "healthy"],
    ["inv_sr_coffee", "lst_soho_residence", "Coffee pods", "coffee", 3, 6, "low"],
    ["inv_cl_soap", "lst_city_loft_02", "Hand soap", "toiletries", 0, 2, "out"]
  ] as const;
  inventory.forEach(([id, listingId, name, category, quantity, reorderThreshold, status]) => batch.set(db.doc(`workspaces/${WS}/inventoryItems/${id}`), { workspaceId: WS, listingId, name, category, unit: "pcs", quantity, reorderThreshold, status, storageLocation: "Housekeeping cupboard" }, { merge: true }));

  const notifications = [
    ["ntf_1", "maintenance", "Bathroom equipment issue scheduled", "Vendor scheduled for Penthouse North"],
    ["ntf_2", "guest", "Guest asked for early check-in", "Oliver Grant requested an earlier arrival window"],
    ["ntf_3", "inventory", "Low coffee stock", "Soho Residence coffee pods are below threshold"]
  ] as const;
  notifications.forEach(([id, type, title, body], idx) => batch.set(db.doc(`workspaces/${WS}/notifications/${id}`), { workspaceId: WS, type, scope: "workspace", title, body, urgency: idx === 0 ? "high" : "medium", entity: { collection: "workspaces", id: WS }, createdAt: ts(`2026-05-18T0${idx + 7}:00:00Z`) }, { merge: true }));

  const activities = [
    ["log_1", "reservation_created", "Oliver Grant reservation created"],
    ["log_2", "cleaning_assigned", "Penthouse North cleaning assigned to Elena Reyes"],
    ["log_3", "issue_created", "Balcony wall light issue opened for Shoreditch Loft"]
  ] as const;
  activities.forEach(([id, action, summary], idx) => batch.set(db.doc(`workspaces/${WS}/activityLogs/${id}`), { workspaceId: WS, actorUid: users[Math.min(idx, users.length - 1)].uid, actorName: users[Math.min(idx, users.length - 1)].displayName, action, entity: { collection: "workspaces", id: WS }, summary, createdAt: ts(`2026-05-18T0${idx + 8}:15:00Z`) }, { merge: true }));

  await batch.commit();
  console.log("Onyx demo data seeded successfully.");
  console.log(`Demo login password: ${password}`);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
