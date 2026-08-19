// Hand-written response/domain types.
//
// The backend's OpenAPI spec (see `npm run gen:api-types` -> api.generated.ts)
// documents request bodies but not response schemas, so these types are
// derived from the Sales Module Requirements doc (Section 6, Core Data Model)
// and the shape of each endpoint's description. Adjust as the real API
// responses are observed.

export type Role =
  | "SUPER_ADMIN"
  | "REGIONAL_ADMIN"
  | "SALES_MANAGER"
  | "SALES_EXECUTIVE"
  | "AUDITOR";

export interface Region {
  id: string;
  code: string;
  name: string;
  active: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  regionId: string;
  reportingToId?: string | null;
  status?: string;
}

export type PermissionEffect = "GRANT" | "DENY";

export interface PermissionOverride {
  id: string;
  userId: string;
  permissionKey: string;
  effect: PermissionEffect;
  grantedById?: string;
  reason?: string;
  expiresAt?: string | null;
  createdAt?: string;
}

export interface EffectivePermissions {
  role: Role;
  roleDefaults: string[];
  effectivePermissions: string[];
  overrides: PermissionOverride[];
}

// Lead Source is now an admin-managed picklist rather than a fixed enum —
// any non-empty string matching an active PicklistOption(LEAD_SOURCE) code.
export type LeadSource = string;

export type PicklistType = "LEAD_SOURCE" | "PRODUCT_INTEREST";

export interface PicklistOption {
  id: string;
  listType: PicklistType;
  code: string;
  label: string;
  active: boolean;
  sortOrder: number;
}

export type LeadStatus = "NEW" | "QUALIFIED" | "LOST";

export interface FollowUp {
  id: string;
  leadId: string;
  note: string;
  channel: string;
  nextActionAt?: string | null;
  createdBy: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  refNo: string;
  contactName: string;
  companyName?: string;
  contactPhone?: string;
  contactEmail?: string;
  address?: string | null;
  gpsLatitude?: number | string | null;
  gpsLongitude?: number | string | null;
  visitLocation?: string | null;
  source: LeadSource;
  sourceOther?: string | null;
  productInterest?: string;
  productInterestOther?: string | null;
  notes?: string;
  status: LeadStatus;
  lostReason?: string | null;
  regionId: string;
  ownerId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  followUps?: FollowUp[];
}

export type DealType = "INSTALLATION" | "AMC" | "PRODUCT";

export type OpportunityStage =
  | "NEW"
  | "CONTACTED"
  | "QUOTED"
  | "NEGOTIATION"
  | "WON"
  | "LOST";

export interface StageHistoryEntry {
  id: string;
  fromStage: OpportunityStage | null;
  toStage: OpportunityStage;
  remark?: string;
  actorId: string;
  createdAt: string;
}

export interface Opportunity {
  id: string;
  leadId: string;
  dealType: DealType;
  /** Serialized as a decimal string by the API. */
  value: string;
  stage: OpportunityStage;
  probability?: number;
  expectedClose: string | null;
  wonAt?: string | null;
  ownerId: string;
  regionId: string;
  lostReason?: string | null;
  createdAt: string;
  updatedAt: string;
  stageHistory?: StageHistoryEntry[];
  quotations?: Quotation[];
}

export type QuotationStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "SENT"
  | "ACCEPTED"
  | "REJECTED"
  | "EXPIRED";

// Numeric fields below are serialized as decimal strings by the API
// (Postgres Decimal -> JSON). Parse with Number(...) before doing arithmetic
// or calling toLocaleString.
export interface QuotationLine {
  id: string;
  catalogItemId?: string;
  description: string;
  qty: string;
  unitPrice: string;
  discount?: string;
  /** Absolute tax amount for this line (not a percentage). */
  tax?: string;
  lineTotal?: string;
}

export interface Quotation {
  id: string;
  opportunityId: string;
  version: number;
  status: QuotationStatus;
  subtotal: string;
  discountTotal: string;
  taxTotal: string;
  grandTotal: string;
  validTill?: string | null;
  approvedById?: string | null;
  approvedAt?: string | null;
  lines: QuotationLine[];
  createdAt: string;
  updatedAt: string;
}

export interface CatalogItem {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  basePrice: string;
  taxClass: string;
  active: boolean;
}

export type PriceRuleType =
  | "REGION_OVERRIDE"
  | "VOLUME_SLAB"
  | "CUSTOMER_TIER"
  | "PROMOTIONAL";

export interface PriceRule {
  id: string;
  catalogItemId: string;
  regionId?: string;
  ruleType: PriceRuleType;
  value: number;
  effectiveFrom: string;
  effectiveTo?: string;
}

export interface ResolvedPrice {
  catalogItem: CatalogItem;
  price: number;
}

export type AmcType = "COMPREHENSIVE" | "NON_COMPREHENSIVE";
export type AmcFrequency = "MONTHLY" | "QUARTERLY" | "ANNUAL";

export interface AmcContract {
  id: string;
  customerId: string;
  opportunityId: string;
  type: AmcType;
  frequency: AmcFrequency;
  start: string;
  end: string;
  value: number;
  status: string;
}

export interface Project {
  id: string;
  opportunityId: string;
  customerId: string;
  site: string;
  timeline?: string;
  status: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  regionId: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface DecodedAccessToken {
  sub?: string;
  role?: Role;
  regionId?: string;
  exp?: number;
  iat?: number;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: {
    formErrors?: string[];
    fieldErrors?: Record<string, string[]>;
  };
}

// --- Sales Query Management (Jira-style CRM communication, Phase 1) --------

export type DepartmentMemberRole = "MANAGER" | "EMPLOYEE";

export interface Department {
  id: string;
  code: string;
  name: string;
  regionId: string | null;
  active: boolean;
}

export interface DepartmentMemberEntry {
  id: string;
  departmentId: string;
  userId: string;
  roleInDept: DepartmentMemberRole;
  user?: { id: string; name: string; email: string };
}

export interface DepartmentMembership {
  departmentId: string;
  roleInDept: DepartmentMemberRole;
}

export type MeetingType = "WALK_IN" | "SCHEDULED" | "REFERRAL";
export type QueryPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type SalesQueryStatus =
  | "NEW"
  | "ASSIGNED"
  | "UNDER_REVIEW"
  | "WAITING_FOR_CUSTOMER"
  | "WAITING_FOR_INTERNAL_TEAM"
  | "QUOTATION_PREPARATION"
  | "QUOTATION_PREPARED"
  | "QUOTATION_SENT"
  | "NEGOTIATION"
  | "WON"
  | "LOST"
  | "CANCELLED"
  | "CLOSED";

export interface QueryAttachment {
  id: string;
  queryId: string;
  commentId?: string | null;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedBy: string;
  createdAt: string;
}

export type CommentEntityType = "LEAD" | "OPPORTUNITY";

// Non-threaded comment shared by Leads and Opportunities — same conventions
// as QueryComment, minus the pinning/reactions/threading/attachments that
// only Sales Queries need.
export interface EntityComment {
  id: string;
  entityType: CommentEntityType;
  entityId: string;
  body: string;
  isInternalNote: boolean;
  mentionedUserIds: string[];
  authorId: string;
  author?: { id: string; name: string; email: string; role: Role };
  edited: boolean;
  editedAt?: string | null;
  deleted: boolean;
  deletedAt?: string | null;
  createdAt: string;
}

export interface QueryComment {
  id: string;
  queryId: string;
  parentId?: string | null;
  body: string;
  isInternalNote: boolean;
  mentionedUserIds: string[];
  authorId: string;
  edited: boolean;
  editedAt?: string | null;
  deleted: boolean;
  deletedAt?: string | null;
  isPinned: boolean;
  pinnedAt?: string | null;
  pinnedBy?: string | null;
  createdAt: string;
  replies?: QueryComment[];
  attachments?: QueryAttachment[];
}

export interface QueryActivityEntry {
  id: string;
  queryId: string;
  actorId: string;
  action:
    | "CREATED"
    | "ASSIGNED"
    | "OWNER_CHANGED"
    | "STATUS_CHANGED"
    | "PRIORITY_CHANGED"
    | "DUE_DATE_UPDATED"
    | "COMMENT_ADDED"
    | "ATTACHMENT_ADDED"
    | "FOLLOW_UP_ADDED"
    | "REASSIGNED";
  fromStatus?: SalesQueryStatus | null;
  toStatus?: SalesQueryStatus | null;
  remark?: string | null;
  createdAt: string;
}

export interface SalesQuery {
  id: string;
  refNo: string;
  customerId?: string | null;
  customerName: string;
  companyName?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  address?: string | null;
  gstNumber?: string | null;
  city?: string | null;
  meetingType: MeetingType;
  visitDate?: string | null;
  visitLocation?: string | null;
  gpsLatitude?: number | null;
  gpsLongitude?: number | null;
  subject?: string | null;
  requirement: string;
  priority: QueryPriority;
  productInterest?: string | null;
  quantity?: number | null;
  budget?: string | null;
  estimatedValue?: string | null;
  expectedDeliveryDate?: string | null;
  dueDate?: string | null;
  slaDeadline?: string | null;
  tags?: string[] | null;
  labels?: string[] | null;
  status: SalesQueryStatus;
  closeReason?: string | null;
  departmentId?: string | null;
  department?: Department | null;
  regionId: string;
  ownerId: string;
  assignedToId?: string | null;
  assignedTo?: User | null;
  owner?: User | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  comments?: QueryComment[];
  attachments?: QueryAttachment[];
  activities?: QueryActivityEntry[];
  followUps?: QueryFollowUp[];
}

export type FollowUpStatus =
  | "PENDING"
  | "COMPLETED"
  | "RESCHEDULED"
  | "OVERDUE"
  | "CANCELLED";
// `channel` is a free-text column on the backend (String, not an enum) —
// these are just the values the create/update DTOs' zod schema accepts.
export type FollowUpChannel =
  | "call"
  | "meeting"
  | "email"
  | "whatsapp"
  | "on_site"
  | "other";

export interface QueryFollowUp {
  id: string;
  queryId: string;
  title: string;
  note?: string | null;
  scheduledAt: string;
  reminderMinutes?: number | null;
  channel?: FollowUpChannel | string | null;
  assignedToId?: string | null;
  assignedTo?: { id: string; name: string; email: string } | null;
  status: FollowUpStatus;
  customerResponse?: string | null;
  outcome?: string | null;
  completedAt?: string | null;
  rescheduledCount?: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type NotificationType =
  | "QUERY_ASSIGNED"
  | "QUERY_STATUS_CHANGED"
  | "QUERY_COMMENT_ADDED"
  | "QUERY_MENTIONED";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  entityType: string;
  entityId: string;
  title: string;
  body?: string | null;
  readAt?: string | null;
  createdAt: string;
}
