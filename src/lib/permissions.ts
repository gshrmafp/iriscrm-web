import type { DepartmentMembership, Role } from "@/types/entities";

// Section 3.2 permission matrix — Sales Module Requirements.
export const ROLES: Record<Role, { label: string }> = {
  SUPER_ADMIN: { label: "Super Admin" },
  REGIONAL_ADMIN: { label: "Regional Admin" },
  SALES_MANAGER: { label: "Sales Manager" },
  SALES_EXECUTIVE: { label: "Sales Executive" },
  AUDITOR: { label: "Read-Only / Auditor" },
};

export function isSuperAdmin(role?: Role): boolean {
  return role === "SUPER_ADMIN";
}

export function isRegionalAdminOrAbove(role?: Role): boolean {
  return role === "SUPER_ADMIN" || role === "REGIONAL_ADMIN";
}

export function isManagerOrAbove(role?: Role): boolean {
  return (
    role === "SUPER_ADMIN" ||
    role === "REGIONAL_ADMIN" ||
    role === "SALES_MANAGER"
  );
}

export function canEditCatalog(role?: Role): boolean {
  return isSuperAdmin(role);
}

export function canApprovePriceRule(role?: Role): boolean {
  return isRegionalAdminOrAbove(role);
}

export function canReassignOpportunity(role?: Role): boolean {
  return isManagerOrAbove(role);
}

export function canApproveQuotation(role?: Role): boolean {
  return isManagerOrAbove(role);
}

export function canApproveHighValueOverride(role?: Role): boolean {
  return isRegionalAdminOrAbove(role);
}

export function canManageUsers(role?: Role): boolean {
  return isRegionalAdminOrAbove(role);
}

export function canConfigureRegions(role?: Role): boolean {
  return isSuperAdmin(role);
}

export function canViewCrossRegionReports(role?: Role): boolean {
  return isSuperAdmin(role);
}

export function isReadOnly(role?: Role): boolean {
  return role === "AUDITOR";
}

// --- Sales Query Management — department-membership-aware helpers ---------
//
// Department membership is layered ON TOP OF the role/permission system
// above, not a replacement for it: these functions combine a role check with
// a membership check, mirroring the backend's two-layer authorization
// (route-level permission key + service-level assertDepartmentAuthorized).

export function isDepartmentMember(
  departmentId: string | null | undefined,
  memberships: DepartmentMembership[],
): boolean {
  return !!departmentId && memberships.some((m) => m.departmentId === departmentId);
}

export function canCommentOnQuery(
  role: Role | undefined,
  memberships: DepartmentMembership[],
  query: { departmentId?: string | null; ownerId: string },
  currentUserId?: string,
): boolean {
  return (
    isRegionalAdminOrAbove(role) ||
    query.ownerId === currentUserId ||
    isDepartmentMember(query.departmentId, memberships)
  );
}

export function canChangeQueryStatus(
  role: Role | undefined,
  memberships: DepartmentMembership[],
  query: { departmentId?: string | null; ownerId: string },
  currentUserId?: string,
): boolean {
  return (
    isManagerOrAbove(role) ||
    query.ownerId === currentUserId ||
    isDepartmentMember(query.departmentId, memberships)
  );
}

export function canAssignQueryDepartment(role?: Role): boolean {
  return isManagerOrAbove(role);
}

export function canReassignQueryOwner(role?: Role): boolean {
  return isManagerOrAbove(role);
}

// Mirrors the backend's SALES_QUERY_COMMENT_MODERATE permission, which is
// granted to SUPER_ADMIN / REGIONAL_ADMIN / SALES_MANAGER only — it is a
// role-based grant, not department-membership-scoped, so this intentionally
// does not consult `memberships` (unlike canCommentOnQuery/canChangeQueryStatus).
export function canModerateQueryComment(role: Role | undefined): boolean {
  return isManagerOrAbove(role);
}

// Same visibility/authorization shape as canChangeQueryStatus — mirrors the
// backend's shared assertDepartmentAuthorized gate used for both update and
// follow-up management.
export function canEditQuery(
  role: Role | undefined,
  memberships: DepartmentMembership[],
  query: { departmentId?: string | null; ownerId: string },
  currentUserId?: string,
): boolean {
  return (
    isManagerOrAbove(role) ||
    query.ownerId === currentUserId ||
    isDepartmentMember(query.departmentId, memberships)
  );
}

export function canManageFollowUps(
  role: Role | undefined,
  memberships: DepartmentMembership[],
  query: { departmentId?: string | null; ownerId: string },
  currentUserId?: string,
): boolean {
  return (
    isManagerOrAbove(role) ||
    query.ownerId === currentUserId ||
    isDepartmentMember(query.departmentId, memberships)
  );
}

export function canDeleteAttachment(
  role: Role | undefined,
  attachment: { uploadedBy: string },
  currentUserId?: string,
): boolean {
  return isManagerOrAbove(role) || attachment.uploadedBy === currentUserId;
}
