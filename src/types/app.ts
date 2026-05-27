export interface FirestoreTimestampLike {
  seconds?: number;
  nanoseconds?: number;
  toDate?: () => Date;
}

export type AppRole = "admin" | "staff" | "cleaner" | "contractor";

export interface PermissionMap {
  canViewAnalytics?: boolean;
  canManageTeam?: boolean;
  canManageListings?: boolean;
  canManageReservations?: boolean;
  canManageGuests?: boolean;
  canManageCleanings?: boolean;
  canManageMaintenance?: boolean;
  canManageInventory?: boolean;
  canManageSettings?: boolean;
  canUploadMaintenanceEvidence?: boolean;
}

export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string | null;
  phone?: string | null;
  defaultWorkspaceId?: string | null;
  preferences?: { darkMode?: boolean; emailNotifications?: boolean; pushNotifications?: boolean; timezone?: string };
  lastLoginAt?: FirestoreTimestampLike | null;
}

export interface WorkspaceMember {
  id: string;
  uid: string;
  role: AppRole;
  status: "active" | "invited" | "suspended";
  displayName: string;
  email: string;
  photoURL?: string | null;
  assignedListingIds?: string[];
  assignedIssueIds?: string[];
  permissions?: PermissionMap;
  vendorId?: string | null;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  status: "active" | "trial" | "suspended";
  timezone: string;
  currency: string;
  country?: string;
  settings?: { defaultCheckInTime?: string; defaultCheckOutTime?: string; requireCleaningPhotos?: boolean; requireDamageReportOnFlag?: boolean };
  onboarding?: { completed: boolean; step: string };
}

export interface Listing {
  id: string;
  workspaceId: string;
  status: "active" | "attention" | "archived";
  name: string;
  internalCode: string;
  propertyType: string;
  address: { line1: string; line2?: string; city: string; region?: string; postcode?: string; country: string };
  pricing?: { baseRate: number; cleaningFee: number; weekendUpliftPct?: number; minimumStayNights?: number };
  marketplace?: { airbnbUrl?: string; vrboUrl?: string; source?: string };
  photos?: { coverUrl?: string; galleryUrls?: string[] };
  access?: { smartLockModel?: string; wifiName?: string; wifiPassword?: string; checkInInstructions?: string; parkingNotes?: string };
  operations?: { preferredCleanerUid?: string | null; laundryProvider?: string | null; turnoverNotes?: string };
  houseRules?: string[];
  statsSnapshot?: { occupancy30d?: number; revenueMtd?: number; adr30d?: number; revpar30d?: number; nextCheckInAt?: FirestoreTimestampLike | null; nextCheckOutAt?: FirestoreTimestampLike | null };
  flags?: { attentionRequired?: boolean; lowStock?: boolean; maintenanceOpen?: boolean };
  updatedAt?: FirestoreTimestampLike;
}

export interface Reservation {
  id: string;
  workspaceId: string;
  listingId: string;
  status: "confirmed" | "ready_for_check_in" | "checked_in" | "checked_out" | "cancelled" | "blocked";
  source: "manual" | "airbnb" | "vrbo";
  externalReservationId?: string | null;
  guest: { primaryName: string; email?: string | null; phone?: string | null; adults: number; children?: number; infants?: number };
  checkInAt: FirestoreTimestampLike;
  checkOutAt: FirestoreTimestampLike;
  financials?: { grossAmount: number; cleaningFee?: number; taxes?: number; netAmount?: number; currency: string };
  operational?: { cleaningJobId?: string | null; guestThreadId?: string | null; lateCheckoutRequested?: boolean; earlyCheckInRequested?: boolean };
  notes?: string;
  createdAt?: FirestoreTimestampLike;
  updatedAt?: FirestoreTimestampLike;
}

export interface GuestThread {
  id: string;
  workspaceId: string;
  listingId: string;
  reservationId: string;
  status: "open" | "pending" | "resolved";
  guest: { name: string; email?: string | null; phone?: string | null };
  tags?: string[];
  lastMessageAt: FirestoreTimestampLike;
  lastMessagePreview?: string;
  lastMessageKind?: "guest_message" | "team_message" | "internal_note" | "system_event";
  unreadCounts?: { guestVisible?: number; teamUnread?: number };
  escalation?: { hasOpenIssue: boolean; maintenanceIssueId?: string | null };
}

export interface GuestMessage {
  id: string;
  workspaceId: string;
  threadId: string;
  reservationId?: string | null;
  listingId?: string | null;
  kind: "guest_message" | "team_message" | "internal_note" | "system_event";
  sender: { uid?: string | null; displayName?: string | null; source: "guest" | "team" | "system" };
  body: string;
  visibleToGuest: boolean;
  delivery?: { state: "draft" | "queued" | "sent" | "failed"; sentAt?: FirestoreTimestampLike | null; failedReason?: string | null; scheduledFor?: FirestoreTimestampLike | null };
  createdAt: FirestoreTimestampLike;
}

export interface CleaningJob {
  id: string;
  workspaceId: string;
  listingId: string;
  reservationId?: string | null;
  status: "pending" | "assigned" | "in_progress" | "review" | "completed" | "overdue";
  priority: "standard" | "high" | "urgent" | "premium";
  scheduledStartAt: FirestoreTimestampLike;
  scheduledEndAt: FirestoreTimestampLike;
  assignedCleanerUid?: string | null;
  assignedCleanerName?: string | null;
  sameDayTurnover: boolean;
  checklist?: Array<{ id: string; label: string; required: boolean; checked: boolean }>;
  suppliesNeeded?: string[];
  damageReport?: { hasDamage: boolean; summary?: string; photoUrls?: string[]; convertedMaintenanceIssueId?: string | null };
  completion?: { startedAt?: FirestoreTimestampLike | null; submittedAt?: FirestoreTimestampLike | null; reviewedAt?: FirestoreTimestampLike | null; reviewedByUid?: string | null; readyForArrival?: boolean; photoUrls?: string[]; notes?: string | null };
  createdAt?: FirestoreTimestampLike;
  updatedAt?: FirestoreTimestampLike;
}

export interface MaintenanceIssue {
  id: string;
  workspaceId: string;
  listingId: string;
  reservationId?: string | null;
  source: "manual" | "cleaning_damage" | "guest_message" | "inspection";
  title: string;
  description?: string;
  category: string;
  severity: "low" | "medium" | "high" | "urgent";
  status: "open" | "triaged" | "scheduled" | "in_progress" | "resolved" | "closed";
  assigneeUid?: string | null;
  assigneeName?: string | null;
  vendorId?: string | null;
  vendorName?: string | null;
  vendorPhone?: string | null;
  evidence?: string[];
  attachments?: Array<{ name: string; url: string; uploadedAt?: FirestoreTimestampLike | null; uploadedByUid?: string | null }>;
  cost?: { estimate?: number; final?: number; currency: string };
  resolution?: { resolvedAt?: FirestoreTimestampLike | null; resolutionNote?: string | null };
  createdAt?: FirestoreTimestampLike;
  updatedAt?: FirestoreTimestampLike;
}

export interface Vendor {
  id: string;
  workspaceId: string;
  name: string;
  category: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  serviceAreas?: string[];
  preferred?: boolean;
  status: "active" | "inactive";
  rating?: number;
  notes?: string | null;
}

export interface InventoryItem {
  id: string;
  workspaceId: string;
  listingId?: string | null;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  reorderThreshold: number;
  status: "healthy" | "low" | "out";
  vendorNote?: string | null;
  storageLocation?: string | null;
}

export interface NotificationItem {
  id: string;
  workspaceId: string;
  type: "booking" | "guest" | "cleaning" | "maintenance" | "inventory" | "team" | "system";
  scope: "workspace" | "user";
  recipientUid?: string | null;
  title: string;
  body: string;
  urgency: "low" | "medium" | "high" | "urgent";
  entity: { collection: string; id: string };
  readAt?: FirestoreTimestampLike | null;
  createdAt: FirestoreTimestampLike;
}

export interface ActivityLog {
  id: string;
  workspaceId: string;
  actorUid?: string | null;
  actorName?: string | null;
  action: string;
  entity: { collection: string; id: string; label?: string };
  summary: string;
  createdAt: FirestoreTimestampLike;
}

export interface QueryState<T> {
  data: T;
  loading: boolean;
  error: string | null;
}

export interface NavItem {
  title: string;
  href: string;
  icon: string;
  permission?: keyof PermissionMap;
}

export interface DashboardTrendPoint {
  label: string;
  revenue: number;
  arrivals: number;
  departures: number;
}
