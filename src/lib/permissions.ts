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

export function isDepartmentManager(
  departmentId: string | null | undefined,
  memberships: DepartmentMembership[],
): boolean {
  return memberships.some(
    (m) => m.departmentId === departmentId && m.roleInDept === "MANAGER",
  );
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

export function canModerateQueryComment(
  role: Role | undefined,
  memberships: DepartmentMembership[],
  query: { departmentId?: string | null },
): boolean {
  return isRegionalAdminOrAbove(role) || isDepartmentManager(query.departmentId, memberships);
}

export function canDeleteAttachment(
  role: Role | undefined,
  attachment: { uploadedBy: string },
  currentUserId?: string,
): boolean {
  return isManagerOrAbove(role) || attachment.uploadedBy === currentUserId;
}
