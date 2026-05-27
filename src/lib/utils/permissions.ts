import type { AppRole, CleaningJob, MaintenanceIssue, PermissionMap, WorkspaceMember } from "@/types/app";

const elevatedRoles: AppRole[] = ["admin", "staff"];

export function hasPermission(member: WorkspaceMember | null, permission?: keyof PermissionMap) {
  if (!member || member.status !== "active") return false;
  if (member.role === "admin") return true;
  if (!permission) return true;
  return Boolean(member.permissions?.[permission]);
}

export function hasRole(member: WorkspaceMember | null, roles: AppRole[]) {
  return !!member && member.status === "active" && roles.includes(member.role);
}

export function isAdmin(member: WorkspaceMember | null) {
  return hasRole(member, ["admin"]);
}

export function isStaff(member: WorkspaceMember | null) {
  return hasRole(member, ["staff"]);
}

export function isCleaner(member: WorkspaceMember | null) {
  return hasRole(member, ["cleaner"]);
}

export function isContractor(member: WorkspaceMember | null) {
  return hasRole(member, ["contractor"]);
}

export function isElevatedOperator(member: WorkspaceMember | null) {
  return hasRole(member, elevatedRoles);
}

export function canAccessAssignedListing(member: WorkspaceMember | null, listingId?: string | null) {
  if (!member || member.status !== "active" || !listingId) return false;
  if (isElevatedOperator(member)) return true;
  return Boolean(member.assignedListingIds?.includes(listingId));
}

export function canAccessAssignedIssue(member: WorkspaceMember | null, issueId?: string | null) {
  if (!member || member.status !== "active" || !issueId) return false;
  if (isElevatedOperator(member)) return true;
  return Boolean(member.assignedIssueIds?.includes(issueId));
}

export function canManageCleaningJob(member: WorkspaceMember | null, uid?: string | null, job?: CleaningJob | null) {
  if (!member || member.status !== "active") return false;
  if (hasPermission(member, "canManageCleanings")) return true;
  if (!job) return false;
  return isCleaner(member) && Boolean(uid) && job.assignedCleanerUid === uid;
}

export function canManageMaintenanceIssue(member: WorkspaceMember | null, uid?: string | null, issue?: MaintenanceIssue | null) {
  if (!member || member.status !== "active") return false;
  if (hasPermission(member, "canManageMaintenance") || hasPermission(member, "canUploadMaintenanceEvidence")) return true;
  if (!issue) return false;
  if (isContractor(member)) {
    return Boolean(
      (uid && issue.assigneeUid === uid) ||
        (issue.id && member.assignedIssueIds?.includes(issue.id)) ||
        (member.vendorId && issue.vendorId === member.vendorId)
    );
  }
  return false;
}

export function canViewFinancials(member: WorkspaceMember | null) {
  return hasRole(member, ["admin", "staff"]);
}

export function roleLabel(role?: AppRole | null) {
  switch (role) {
    case "admin":
      return "Admin";
    case "staff":
      return "Staff";
    case "cleaner":
      return "Cleaner";
    case "contractor":
      return "Contractor";
    default:
      return "Unknown role";
  }
}
