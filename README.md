# IRIS CRM — Frontend Web App

> **Next.js 16 · React 19 · TypeScript 5** SPA for the IRIS CRM platform. Sales pipeline, customer enquiries, user management, role-aware dashboards, and JWT authentication against the IRIS backend.

---

## 🧱 Tech Stack

| Layer | Library | Why |
|---|---|---|
| Framework | **Next.js 16** App Router | Server components · route groups · SEO |
| UI | **React 19** + **Tailwind v4** + **shadcn/ui 4** | Lightweight design system; zero client-runtime CSS |
| Data-fetching | **TanStack Query v5** (`@tanstack/react-query`) | Caching, optimistic updates, query invalidation |
| Tables | **TanStack Table v8** | Pagination / filtering / sort for leads / opportunities / queries |
| Forms | **React Hook Form 7** + `@hookform/resolvers` + **Zod 4** | Fully typed schemas, async validation |
| HTTP | **Axios 1.18** via `src/lib/api-client.ts` | JWT injection · 401 auto-logout · 422/409 errors surfaced |
| Types | **Hand-coded entities** (`src/types/entities.ts`) + **OpenAPI codegen** (`src/types/api.generated.ts`) | Domain types handwritten; API *payload* types generated from backend Swagger |
| Auth | JWT in **localStorage** (via `auth-storage.ts`) + `<AuthProvider>` | Login · refresh · role + region exposed via React context |
| UX | **Framer Motion** · **Lucide** icons · **Sonner 2** toasts · `next-themes` | Smooth animations; consistent notification UX |
| Codegen | **openapi-typescript** `npm run gen:api-types` | Pulls `http://localhost:3000/api-docs.json` → `api.generated.ts` |

---

## 🗂️ Project Structure

```
IrisFrontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx                       ← root Providers (Theme, ReactQuery, Auth), globals.css
│   │   ├── page.tsx                         ← / → redirects to /dashboard or /login
│   │   ├── globals.css                      ← Tailwind entry + custom tokens
│   │   ├── (auth)/login/page.tsx            ← Sign-in form
│   │   └── (dashboard)/
│   │       ├── layout.tsx                   ← Protected route wrapper · sidebar + header
│   │       ├── dashboard/page.tsx           ← KPIs · funnel · byStatus · byPriority · activity
│   │       ├── leads/  page.tsx · [id]/     ← Leads table + Kanban, lead detail (follow-ups, actions)
│   │       ├── opportunities/  page.tsx · [id]/  ← Opportunity pipeline board + detail + handoff
│   │       ├── sales-queries/ page.tsx · [id]/    ← CRM-style enquiries (board, list, activity, comments, attachments, follow-ups)
│   │       ├── catalog/  items/  price-rules/     ← Catalog items + price rule management
│   │       └── admin/  users/  picklists/  regions/  permissions/  ← SUPER/REGIONAL admin screens
│   ├── components/
│   │   ├── layout/                          ← Sidebar (role-aware nav) · Header (user menu + notification bell) · PageHeader
│   │   ├── providers/                       ← query-provider.tsx (TanStack defaults, 5 min staleTime)
│   │   ├── ui/                              ← 25+ shadcn components (button, dialog, badge, table, sheet, tabs, calendar…)
│   │   ├── data-table/                      ← reusable DataTable wrapper (TanStack Table + toolbar)
│   │   └── status-badge.tsx                 ← Lead / Opportunity / Query / Quotation status chips
│   ├── features/                            ← Feature-sliced per domain
│   │   ├── auth/                            ← AuthProvider context · useAuth() hook · login API
│   │   ├── leads · opportunities · quotations · catalog · sales-queries
│   │   │   ├── api.ts                       ← typed fetchers using apiClient
│   │   │   ├── hooks.ts                     ← useLeads / useCreateLead (etc.), TanStack Query hooks
│   │   │   ├── constants.ts                 ← STATUS_ORDER, TRANSITIONS, LABELS, PRIORITY, REMARK_REQUIRED
│   │   │   ├── utils.ts                     ← helpers e.g. buildActivityFeed(query)
│   │   │   └── components/                  ← dialogs / sheets / timelines / builders
│   │   ├── picklists · departments · notifications · identity
│   │       └── api.ts + hooks.ts + components
│   ├── lib/
│   │   ├── api-client.ts                    ← Axios instance (baseURL, interceptors: 401 → logout, 422 → Sonner)
│   │   ├── auth-storage.ts                  ← localStorage helpers for JWT + user session
│   │   ├── permissions.ts                   ← Role hierarchy + permission predicates (see RBAC section)
│   │   └── utils.ts                         ← cn() classNames merge (clsx + tailwind-merge)
│   └── types/
│       ├── entities.ts                      ← Hand-written domain types (SalesQuery, Lead, Opportunity, Quotation…)
│       └── api.generated.ts                 ← Auto-generated via openapi-typescript from backend /api-docs.json
└── package.json
```

---

## 🚀 Quick Start

### 0. Prerequisites

- Node **24.x** (tested with `v24.15.0`)
- **Backend server running** at `http://localhost:3000` (see `../Irisbackend/README.md`)

### 1. Install dependencies

```bash
cd IrisFrontend
npm install
```

### 2. Configure API base URL

The default Axios base URL (`src/lib/api-client.ts`) is `http://localhost:3000/api/v1`. Adjust if exposing via another host.

### 3. Run dev server

```bash
npm run dev
# Next.js will start on http://localhost:3001
# (Backend is on port 3000; ports configured to not collide — see Note below)
```

*The frontend Next.js dev server defaults to port 3000 — so if the backend is already using that port, Next will automatically pick the next free port (usually 3001). Use `npm run dev -- -p 3001` to pin it explicitly.*

### 4. Log in

Use any seed user created by the backend Prisma seed:

| Email | Role | Default Password |
|---|---|---|
| `superadmin@iris.local` | **SUPER_ADMIN** | `Admin@12345` |
| `priya.admin@iris.local` | **REGIONAL_ADMIN** (Gurugram) | `Admin@12345` |
| `vikram.manager@iris.local` | **SALES_MANAGER** (Gurugram) | `Admin@12345` |
| `rahul.exec@iris.local` | **SALES_EXECUTIVE** (Gurugram) | `Admin@12345` |
| `anita.auditor@iris.local` | **AUDITOR** (Gurugram) | `Admin@12345` |
| `sanjay.admin@iris.local` | **REGIONAL_ADMIN** (Delhi) | `Admin@12345` |
| `neha.exec@iris.local` | **SALES_EXECUTIVE** (Delhi) | `Admin@12345` |

### 5. Production build

```bash
npm run build   # compiles via next build (.next/ output)
npm start       # runs the optimized server
```

---

## 🔐 Authentication & Permission Handling

### Flow

1. **Login** → `POST /api/v1/auth/login` → backend returns `{accessToken, user}`.
2. **Persistence** → `auth-storage.ts` stores `accessToken` and trimmed `{id, role, name, email, regionId}` in `localStorage`.
3. **Provider** → `<AuthProvider>` (Top-level `(dashboard)/layout.tsx`) hydrates user from storage on mount, exposes:
   ```ts
   interface AuthContext {
     user: { id, name, email, role, regionId } | null;
     isAuthenticated: boolean;
     isInitializing: boolean;
     login({email, password}) → Promise<void>;
     logout() → void;
     updateUser(patch) → void;
   }
   ```
4. **Route protection** → `(dashboard)/layout.tsx` redirects unauthenticated to `/login`.
5. **Per-action guards** → Frontend uses `src/lib/permissions.ts` pure functions. **Backend re-validates everything** (never trust the client — route + service layer double-check).

### Role Hierarchy (permissions.ts)

```ts
Role = SUPER_ADMIN | REGIONAL_ADMIN | SALES_MANAGER | SALES_EXECUTIVE | AUDITOR;
```

| Helper | Allows |
|---|---|
| `isSuperAdmin(role)` | SUPER only |
| `isRegionalAdminOrAbove(role)` | SUPER + REGIONAL |
| `isManagerOrAbove(role)` | SUPER + REGIONAL + SALES_MANAGER |
| `isReadOnly(role)` | AUDITOR only |
| `canEditCatalog()` | SUPER only (matches backend `SALES_CATALOG_MANAGE`) |
| `canApprovePriceRule()` | REGIONAL+ |
| `canReassignOpportunity()` | MANAGER+ |
| `canApproveQuotation()` | MANAGER+ |
| `canApproveHighValueOverride()` | REGIONAL+ (₹50L+) |

### Department-aware (Sales-Query only)

| Predicate | Logic |
|---|---|
| `canCommentOnQuery(role, memberships, query, me)` | REGIONAL+ OR owner OR dept member |
| `canChangeQueryStatus(role, memberships, query, me)` | MANAGER+ OR owner OR dept member |
| `canAssignQueryDepartment(role)` | MANAGER+ only |
| `canModerateQueryComment(role, memberships, query)` | REGIONAL+ OR dept MANAGER |
| `canDeleteAttachment(role, attachment, me)` | MANAGER+ OR uploader === me |

Convenient React hook: `useSalesQueryPermissions(query)` (features/sales-queries/hooks.ts) → `{ canComment, canChangeStatus, canAssign, canModerate }`, combining `useAuth()`, `useMyDepartmentMemberships()` and the pure functions.

---

## 🛒 Sales Module Feature Matrix

### 1. Dashboard (KPI + Funnel + Activity)
`/dashboard` → Summary KPIs (total, open, won, lost, conversion rate, pending/overdue follow-ups, today visits), stacked byStatus/byPriority, and a recently-updated activity list. Executive view scoped to personal; Manager view adds direct reports; Regional/SUPER view spans whole region.

### 2. Leads (`/leads`)
- List view: filters (status, source, owner) + DataTable actions
- Board view: Kanban across NEW | QUALIFIED | LOST
- Dialogs: **Create Lead · Log Follow-up · Mark Lost · Qualify**
- Lead detail: `(/leads/[id])` — contact info, follow-up timeline, actions toolbar

### 3. Opportunities (`/opportunities`)
- **Pipeline board** (`stages = NEW → CONTACTED → QUOTED → NEGOTIATION → WON → LOST` with % probabilities)
- Drag → stage change via `useChangeStage(id)`.
- Detail `(/opportunities/[id])` → stage history, quotations list, quotation builder, win-dialog (triggers AMC/Project creation in backend), loss dialog.
- **Reassign** dialog (MANAGER+ only).

### 4. Quotations (opportunity-scoped)
- **Quotation builder** (`line-items-table.tsx`) — N× lines, per-line discount, tax %, with live pricing totals (subtotal, discount, tax, grand total).
- Workflow buttons: `Submit for Approval` → `Approve/Reject` (MANAGER+ only) → `Send to Customer`.
- **Auto-approval** applies when within role limit (EXEC ≤ ₹50K ≤ 5%; MGR ≤ ₹5L ≤ 15%; etc.) — matches server exactly.
- Version history (Revise → version+1, prior frozen).

### 5. Catalog Items & Price Rules (`/catalog/items`, `/catalog/price-rules`)
- Items CRUD (SUPER-only create/edit; everyone views).
- Resolve-price modal (picks region override, promotion, base in that order).
- Price rule creation (REGIONAL+): REGION_OVERRIDE / VOLUME_SLAB / CUSTOMER_TIER / PROMOTIONAL.

### 6. Sales Queries (Customer Enquiries — Jira-style)
`/sales-queries` + `/:id` — by far the richest flow:

| Area | Features |
|---|---|
| **List + Board** | Dual tab (Kanban across 13 states · DataTable with 20+ filters, sort, paginate) |
| **Create / Edit** | `sales-query-form-sheet.tsx` — capture walk-in / scheduled / referral enquiry; GPS coords, address, GST, budget, due date, SLA deadline, tags, owner override |
| **13-state FSM** | `constants.ts STATUS_TRANSITIONS` mirrors backend *exactly*. Remark required on `LOST · CANCELLED · WAITING_FOR_CUSTOMER · WAITING_FOR_INTERNAL_TEAM · CLOSED`. |
| **Assignment** | Assign department (MANAGER+). Reassign owner (MANAGER+). Automatic notifications published. |
| **Activity Timeline** | Unified chronological feed — merges **COMMENT** (with threaded replies flattened), **STATUS_CHANGE**, **ASSIGNMENT/REASSIGN**, **ATTACHMENT** events |
| **Comments** | Rich input, private internal notes, @mention picker, Pin (dept mgr), Edit/Delete (author or dept mgr) |
| **Attachments** | Drag-drop (10 MB), upload progress, download with `Content-Disposition` header, comment-linked vs standalone scoping |
| **Follow-ups** | Create/list/update + POST `complete / reschedule / cancel`. Reminder offset, channel (CALL/MEETING/EMAIL/WHATSAPP/SITE_VISIT/OTHER), overdue highlighting |
| **Dashboard & Reports** | Sales-manager view: dedicated `stats` endpoint. 8 CSV-exportable reports (pending, conversion, resolution-time, follow-ups, lost, employee perf, dept perf, monthly sales) |

---

## 🧬 Data Model — Entities.ts Snapshot

All domain types live in **[src/types/entities.ts](src/types/entities.ts)**. This file is the **source of truth for response shapes** (backend response schemas aren't yet encoded in the Swagger spec — only request payloads, codegen'd into `api.generated.ts`).

Key types: `Lead`, `FollowUp`, `Opportunity`, `StageHistoryEntry`, `Quotation`, `QuotationLine`, `CatalogItem`, `PriceRule`, `ResolvedPrice`, `SalesQuery`, `QueryComment` (threaded), `QueryAttachment`, `QueryActivityEntry` (10 action types), `QueryFollowUp`, `Department`, `DepartmentMembership`, `User`, `Notification`.

**Enums:** `Role · LeadStatus · DealType · OpportunityStage · QuotationStatus · PriceRuleType · MeetingType · QueryPriority · SalesQueryStatus · FollowUpStatus · FollowUpChannel · NotificationType`.

### API Types — Hand-Written + Codegen Hybrid

**Request payloads** come from `types/api.generated.ts`:
```bash
npm run gen:api-types
# fetches http://localhost:3000/api-docs.json → src/types/api.generated.ts (via openapi-typescript)
```

Example: `type CreateLeadPayload = paths["/leads"]["post"]["requestBody"]["content"]["application/json"];`

**Response types & domain entities** are hand-written (entities.ts). They are aligned to the backend Prisma schema and verified by the API test suite; keep them in sync if you add/remove DB fields.

**Exception — Sales Queries module:** No OpenAPI spec exists yet (backend `/sales-queries` endpoints are **not** annotated with swagger-jsdoc), so payload types are *temporarily* hand-written inside `features/sales-queries/api.ts` (`CreateSalesQueryPayload`, etc.). Once Swagger covers this module, delete the hand-written ones and swap for `paths["/sales-queries"]["post"]` style references.

---

## 🔧 Development Conventions

### Naming
- **API Client calls:** `features/<domain>/api.ts` → `camelCase`, noun-verb. `createSalesQuery`, `listSalesQueries`, `downloadAttachment`.
- **TanStack Query keys:** `<domain>Keys.all | <domain>Keys.detail(id) | <domain>Keys.list(filters)` — keep granular for targeted invalidation.
- **Mutation hooks:** `use<Action><Noun>()` returning `useMutation(...)`; pass `id` for actions scoped to a single resource.

### Typing rules
- Prefer `entities.ts` types for data you display; use `components["schemas"][…]` for raw payload types.
- Never silence errors with `as any` except in clear escape-hatches (search codebase to see existing patterns).

### Role-based UI rendering
Hide **actions** (buttons) the user can't take. **Backend always re-checks.** Example:
```tsx
const { user } = useAuth();
{isManagerOrAbove(user?.role) && <Button onClick={approve}>Approve</Button>}
```

### Error UX
Axios interceptor in `api-client.ts` turns backend errors into Sonner toasts for all `!2xx` codes. 401 clears tokens and redirects to `/login`. 422 surfaces `zod` `issues[]` under each form field via `@hookform/resolvers`.

---

## 🧪 Testing (Recommended Pattern)

- Unit tests for permissions helpers (pure functions — `isDepartmentMember`, `canModerateQueryComment` etc.)
- Component tests for forms (`Dialogs/Sheets`) using rendered HTML + mocked `useMutation`
- E2E (future): Playwright against seeded DB

---

## 🖇️ Frontend ↔ Backend Alignment Checklist

Keep these in lockstep when you change either side:

| Concern | Backend source of truth | Frontend mirror |
|---|---|---|
| Sales Query 13-state FSM | `sales/queries/pipeline.ts` | `features/sales-queries/constants.ts` STATUS_TRANSITIONS, REMARK_REQUIRED |
| Sales Query Status enum | Prisma `SalesQueryStatus` enum + zod refine | `entities.ts` SalesQueryStatus (13 values) |
| Permission keys | `config/permissions.ts` ROLE_DEFAULT_PERMISSIONS | `lib/permissions.ts` canXxx() predicates |
| Approval limits | `config/permissions.ts` APPROVAL_LIMITS | Quotation-builder auto-approve copy |
| Activity entry actions | repository.ts logXxx helpers → 10 strings | `entities.ts` QueryActivityEntry.action union |
| List-sales-queries pagination | `repository.list()` returns PaginatedSalesQueries | `api.ts` listSalesQueries return type + .items unwrapping in consumers |
| Filter param names | `queries/dto.ts` ListSalesQueriesQuery zod schema | `ListSalesQueriesFilters` in `sales-queries/api.ts` |
| DTO payload shape | sales/**/dto.ts zod schemas | `CreateLeadPayload`, etc. in api.ts / api.generated.ts |
| Department membership roles | Prisma `DeptRoleInDept` (MANAGER, EMPLOYEE) | permissions.ts `RoleInDept` + predicates |
| Follow-up channel enum | Prisma `FollowUpChannel` | entities.ts `FollowUpChannel` + `CreateFollowUpPayload.channel` typing |
# iriscrm-web
