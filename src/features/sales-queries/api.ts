import { apiClient } from "@/lib/api-client";
import type {
  FollowUpChannel,
  MeetingType,
  QueryComment,
  QueryFollowUp,
  QueryPriority,
  SalesQuery,
  SalesQueryStatus,
} from "@/types/entities";

// Interim hand-written payload types — no OpenAPI spec exists for this
// module yet. Swap for generated `paths[...]` types once `npm run
// gen:api-types` is re-run against the backend's published spec.
export interface CreateSalesQueryPayload {
  customerId?: string;
  customerName: string;
  companyName?: string;
  contactPhone?: string;
  contactEmail?: string;
  address?: string;
  gstNumber?: string;
  city?: string;
  meetingType: MeetingType;
  visitDate?: string;
  visitLocation?: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
  subject?: string;
  requirement: string;
  priority?: QueryPriority;
  productInterest?: string;
  quantity?: number;
  budget?: number;
  estimatedValue?: number;
  expectedDeliveryDate?: string;
  dueDate?: string;
  slaDeadline?: string;
  tags?: string[];
  labels?: Record<string, unknown>;
  ownerId?: string;
  assignedToId?: string;
}
export type UpdateSalesQueryPayload = Partial<
  Omit<CreateSalesQueryPayload, "customerId" | "ownerId" | "assignedToId">
>;
export interface AssignDepartmentPayload {
  departmentId: string;
  remark?: string;
}
export interface ReassignOwnerPayload {
  ownerId: string;
  assignedToId?: string;
  remark?: string;
}
export interface TransitionStatusPayload {
  toStatus: SalesQueryStatus;
  remark?: string;
}
export interface AddCommentPayload {
  body: string;
  parentId?: string;
  isInternalNote?: boolean;
  mentionedUserIds?: string[];
  isPinned?: boolean;
}
export interface UpdateCommentPayload {
  body: string;
}
export interface PinCommentPayload {
  isPinned: boolean;
}
export interface ListSalesQueriesFilters {
  status?: SalesQueryStatus;
  priority?: QueryPriority;
  departmentId?: string;
  ownerId?: string;
  assignedToId?: string;
  productInterest?: string;
  customerName?: string;
  companyName?: string;
  city?: string;
  queryId?: string;
  refNo?: string;
  createdBy?: string;
  dateFrom?: string;
  dateTo?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  tags?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "createdAt" | "updatedAt" | "dueDate" | "priority" | "estimatedValue";
  sortOrder?: "asc" | "desc";
}
export interface PaginatedSalesQueries {
  items: SalesQuery[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
export interface DashboardStats {
  summary: {
    totalQueries: number;
    openQueries: number;
    wonQueries: number;
    lostQueries: number;
    conversionRate: number;
    pendingFollowUps: number;
    overdueFollowUps: number;
    todayVisits: number;
    totalEstimatedValue: number;
    totalBudget: number;
  };
  byStatus: { status: SalesQueryStatus; count: number }[];
  byPriority: { priority: QueryPriority; count: number }[];
  recentlyUpdated: (Pick<SalesQuery, "id" | "refNo" | "customerName" | "status" | "priority" | "updatedAt"> & {
    owner?: { id: string; name: string };
    department?: { id: string; name: string };
  })[];
}
export interface CreateFollowUpPayload {
  title: string;
  note?: string;
  scheduledAt: string;
  reminderMinutes?: number;
  channel?: FollowUpChannel;
  assignedToId?: string;
}
export interface UpdateFollowUpPayload {
  title?: string;
  note?: string;
  scheduledAt?: string;
  reminderMinutes?: number;
  channel?: FollowUpChannel;
  assignedToId?: string;
}
export interface CompleteFollowUpPayload {
  customerResponse?: string;
  outcome?: string;
}
export interface RescheduleFollowUpPayload {
  scheduledAt: string;
  note?: string;
  reminderMinutes?: number;
}
export interface ListFollowUpsFilters {
  status?: "PENDING" | "COMPLETED" | "CANCELLED" | "RESCHEDULED" | "OVERDUE";
  assignedToId?: string;
  fromDate?: string;
  toDate?: string;
  includeOverdue?: boolean;
}
export interface StatusTransitionsMeta {
  transitions: Record<SalesQueryStatus, SalesQueryStatus[]>;
  remarkRequiredStatuses: SalesQueryStatus[];
  labels: Record<SalesQueryStatus, string>;
  terminalStatuses: SalesQueryStatus[];
}
export interface ReportQueryParams {
  reportType:
    | "sales_conversion"
    | "pending_queries"
    | "follow_ups"
    | "employee_performance"
    | "department_performance"
    | "resolution_time"
    | "lost_opportunity"
    | "monthly_sales";
  fromDate?: string;
  toDate?: string;
  departmentId?: string;
  userId?: string;
  regionId?: string;
  format?: "json" | "csv";
}

export async function listSalesQueries(
  filters: ListSalesQueriesFilters = {},
): Promise<PaginatedSalesQueries> {
  const { data } = await apiClient.get<PaginatedSalesQueries>("/sales-queries", { params: filters });
  return data;
}

export async function getSalesQuery(id: string): Promise<SalesQuery> {
  const { data } = await apiClient.get<SalesQuery>(`/sales-queries/${id}`);
  return data;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data } = await apiClient.get<DashboardStats>("/sales-queries/dashboard/stats");
  return data;
}

export async function getStatusTransitionsMeta(): Promise<StatusTransitionsMeta> {
  const { data } = await apiClient.get<StatusTransitionsMeta>(
    "/sales-queries/meta/status-transitions",
  );
  return data;
}

// Returns a blob for format=csv, otherwise the parsed report rows.
export async function runReport(
  params: ReportQueryParams,
): Promise<Record<string, unknown>[] | Blob> {
  if (params.format === "csv") {
    const response = await apiClient.get("/sales-queries/reports", {
      params,
      responseType: "blob",
    });
    return response.data as Blob;
  }
  const { data } = await apiClient.get<Record<string, unknown>[]>(
    "/sales-queries/reports",
    { params },
  );
  return data;
}

export async function createSalesQuery(
  payload: CreateSalesQueryPayload,
): Promise<SalesQuery> {
  const { data } = await apiClient.post<SalesQuery>("/sales-queries", payload);
  return data;
}

export async function updateSalesQuery(
  id: string,
  payload: UpdateSalesQueryPayload,
): Promise<SalesQuery> {
  const { data } = await apiClient.patch<SalesQuery>(`/sales-queries/${id}`, payload);
  return data;
}

export async function assignDepartment(
  id: string,
  payload: AssignDepartmentPayload,
): Promise<SalesQuery> {
  const { data } = await apiClient.post<SalesQuery>(
    `/sales-queries/${id}/assign-department`,
    payload,
  );
  return data;
}

export async function reassignOwner(
  id: string,
  payload: ReassignOwnerPayload,
): Promise<SalesQuery> {
  const { data } = await apiClient.post<SalesQuery>(
    `/sales-queries/${id}/reassign-owner`,
    payload,
  );
  return data;
}

export async function transitionStatus(
  id: string,
  payload: TransitionStatusPayload,
): Promise<SalesQuery> {
  const { data } = await apiClient.patch<SalesQuery>(`/sales-queries/${id}/status`, payload);
  return data;
}

export async function listComments(id: string): Promise<QueryComment[]> {
  const { data } = await apiClient.get<QueryComment[]>(`/sales-queries/${id}/comments`);
  return data;
}

export async function addComment(
  id: string,
  payload: AddCommentPayload,
): Promise<QueryComment> {
  const { data } = await apiClient.post<QueryComment>(
    `/sales-queries/${id}/comments`,
    payload,
  );
  return data;
}

export async function updateComment(
  id: string,
  commentId: string,
  payload: UpdateCommentPayload,
): Promise<QueryComment> {
  const { data } = await apiClient.patch<QueryComment>(
    `/sales-queries/${id}/comments/${commentId}`,
    payload,
  );
  return data;
}

export async function deleteComment(id: string, commentId: string): Promise<QueryComment> {
  const { data } = await apiClient.delete<QueryComment>(
    `/sales-queries/${id}/comments/${commentId}`,
  );
  return data;
}

export async function pinComment(
  id: string,
  commentId: string,
  payload: PinCommentPayload,
): Promise<QueryComment> {
  const { data } = await apiClient.patch<QueryComment>(
    `/sales-queries/${id}/comments/${commentId}/pin`,
    payload,
  );
  return data;
}

export async function uploadAttachment(
  id: string,
  file: File,
  commentId?: string,
) {
  const formData = new FormData();
  formData.append("file", file);
  if (commentId) formData.append("commentId", commentId);
  const { data } = await apiClient.post(`/sales-queries/${id}/attachments`, formData);
  return data;
}

export async function downloadAttachment(id: string, attachmentId: string, fileName: string) {
  const response = await apiClient.get(`/sales-queries/${id}/attachments/${attachmentId}`, {
    responseType: "blob",
  });
  const url = URL.createObjectURL(response.data as Blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export async function addFollowUp(
  id: string,
  payload: CreateFollowUpPayload,
): Promise<QueryFollowUp> {
  const { data } = await apiClient.post<QueryFollowUp>(
    `/sales-queries/${id}/follow-ups`,
    payload,
  );
  return data;
}

export async function listFollowUps(
  id: string,
  filters: ListFollowUpsFilters = {},
): Promise<QueryFollowUp[]> {
  const { data } = await apiClient.get<QueryFollowUp[]>(
    `/sales-queries/${id}/follow-ups`,
    { params: filters },
  );
  return data;
}

export async function updateFollowUp(
  id: string,
  followUpId: string,
  payload: UpdateFollowUpPayload,
): Promise<QueryFollowUp> {
  const { data } = await apiClient.patch<QueryFollowUp>(
    `/sales-queries/${id}/follow-ups/${followUpId}`,
    payload,
  );
  return data;
}

export async function completeFollowUp(
  id: string,
  followUpId: string,
  payload: CompleteFollowUpPayload = {},
): Promise<QueryFollowUp> {
  const { data } = await apiClient.post<QueryFollowUp>(
    `/sales-queries/${id}/follow-ups/${followUpId}/complete`,
    payload,
  );
  return data;
}

export async function rescheduleFollowUp(
  id: string,
  followUpId: string,
  payload: RescheduleFollowUpPayload,
): Promise<QueryFollowUp> {
  const { data } = await apiClient.post<QueryFollowUp>(
    `/sales-queries/${id}/follow-ups/${followUpId}/reschedule`,
    payload,
  );
  return data;
}

export async function cancelFollowUp(
  id: string,
  followUpId: string,
): Promise<QueryFollowUp> {
  const { data } = await apiClient.post<QueryFollowUp>(
    `/sales-queries/${id}/follow-ups/${followUpId}/cancel`,
  );
  return data;
}
