// Human-readable mirror of the backend's flat PERMISSIONS registry
// (Irisbackend/src/config/permissions.ts). Keep in sync when a new
// permission key is added there — nothing here is fetched from the server.
export interface PermissionCatalogItem {
  key: string;
  label: string;
  description: string;
}

export interface PermissionCatalogGroup {
  group: string;
  items: PermissionCatalogItem[];
}

export const PERMISSION_CATALOG: PermissionCatalogGroup[] = [
  {
    group: "Identity & Access",
    items: [
      { key: "identity.region.configure", label: "Configure Regions", description: "Create and manage regions" },
      { key: "identity.user.manage", label: "Manage Users", description: "Create users and change their active status" },
      {
        key: "identity.permission_override.manage",
        label: "Manage Permission Overrides",
        description: "Grant or deny individual permissions for a user",
      },
    ],
  },
  {
    group: "Catalog",
    items: [
      { key: "sales.catalog.view", label: "View Catalog", description: "View the product/service catalog" },
      { key: "sales.catalog.manage", label: "Manage Catalog", description: "Add or edit catalog items" },
      { key: "sales.catalog.approve", label: "Approve Price Rules", description: "Approve catalog price rules" },
    ],
  },
  {
    group: "Leads",
    items: [
      { key: "sales.lead.view", label: "View Leads", description: "View leads visible to the user's scope" },
      { key: "sales.lead.create", label: "Create Leads", description: "Capture new sales leads" },
      { key: "sales.lead.reassign", label: "Reassign Leads", description: "Change a lead's owner" },
      { key: "sales.lead.comment", label: "Comment on Leads", description: "Add comments to a lead" },
    ],
  },
  {
    group: "Opportunities",
    items: [
      { key: "sales.opportunity.view", label: "View Opportunities", description: "View opportunities visible to the user's scope" },
      { key: "sales.opportunity.create", label: "Create Opportunities", description: "Qualify leads into opportunities" },
      { key: "sales.opportunity.reassign", label: "Reassign Opportunities", description: "Change an opportunity's owner" },
      { key: "sales.opportunity.win", label: "Win Opportunities", description: "Mark an opportunity as Won" },
      { key: "sales.opportunity.comment", label: "Comment on Opportunities", description: "Add comments to an opportunity" },
    ],
  },
  {
    group: "Quotations",
    items: [
      { key: "sales.quotation.view", label: "View Quotations", description: "View draft and sent quotations" },
      { key: "sales.quotation.create", label: "Create Quotations", description: "Build and revise quotations" },
      { key: "sales.quotation.approve", label: "Approve Quotations", description: "Approve a quotation within normal limits" },
      {
        key: "sales.quotation.approve.override",
        label: "Override Quotation Approval Limits",
        description: "Approve a quotation beyond the role's normal value/discount limit",
      },
    ],
  },
  {
    group: "AMC & Projects",
    items: [
      { key: "sales.amc.view", label: "View AMC Contracts", description: "View AMC contract hand-offs" },
      { key: "sales.project.view", label: "View Projects", description: "View installation project hand-offs" },
    ],
  },
  {
    group: "Reports & Dashboard",
    items: [
      { key: "sales.report.view.region", label: "View Region Reports", description: "View reports scoped to the user's own region" },
      { key: "sales.report.view.cross_region", label: "View Cross-Region Reports", description: "View reports across all regions" },
      { key: "sales.report.export", label: "Export Reports", description: "Export sales query reports as CSV" },
      { key: "sales.dashboard.view", label: "View Dashboard", description: "View the sales dashboard" },
    ],
  },
  {
    group: "Sales Queries",
    items: [
      { key: "sales.query.view", label: "View Sales Queries", description: "View sales queries visible to the user's scope" },
      { key: "sales.query.create", label: "Create Sales Queries", description: "Capture a new sales query" },
      { key: "sales.query.update", label: "Update Sales Queries", description: "Edit an open sales query" },
      { key: "sales.query.assign_department", label: "Assign Department", description: "Assign a sales query to a department" },
      { key: "sales.query.reassign_owner", label: "Reassign Owner", description: "Change a sales query's owner" },
      { key: "sales.query.status_transition", label: "Change Status", description: "Move a sales query through its pipeline" },
      { key: "sales.query.comment", label: "Comment", description: "Add comments to a sales query" },
      { key: "sales.query.comment.moderate", label: "Moderate Comments", description: "Pin comments on behalf of a department" },
      { key: "sales.query.attachment.upload", label: "Upload Attachments", description: "Attach files to a sales query" },
      { key: "sales.query.followup.manage", label: "Manage Follow-ups", description: "Create, reschedule and complete follow-ups" },
      { key: "sales.query.followup.view", label: "View Follow-ups", description: "View a sales query's follow-up schedule" },
    ],
  },
  {
    group: "Departments",
    items: [
      { key: "department.manage", label: "Manage Departments", description: "Create departments and manage membership" },
    ],
  },
  {
    group: "Notifications",
    items: [{ key: "notification.view", label: "View Notifications", description: "View in-app notifications" }],
  },
  {
    group: "Picklists",
    items: [
      { key: "picklist.manage", label: "Manage Picklists", description: "Manage Lead Source / Product Interest options" },
    ],
  },
];
