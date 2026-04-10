# 📚 Detailed Database Schema + Runtime Flows (Groups)
**Project:** Project Management SaaS (Laravel API + Next.js)  
**Scope:** Multi-workspace, RBAC, Projects/Tasks, Workflow history, Comments/Mentions, Notifications/Preferences, Audit logs, Soft delete + retention  
**Note:** Subscriptions/Billing postponed for later.

This document expands your schema into:
- **Groups** (tables by purpose)
- **Columns** (with types + constraints)
- **Relationships** (how tables connect)
- **Runtime Flows** (what happens when rows are created/updated)

---

## 0) Global Rules (Applies everywhere)

### 0.1 IDs and common columns
- IDs: `BIGINT UNSIGNED AUTO_INCREMENT`
- Timestamps: `created_at`, `updated_at`
- Soft delete: `deleted_at TIMESTAMP NULL` (only for entities we want to restore)
- Tenant isolation: every tenant-owned table has `workspace_id BIGINT UNSIGNED NOT NULL`

### 0.2 Tenant isolation (the #1 rule)
**Every workspace-scoped request must include** `X-Workspace-Id`.

Backend must enforce:
1) Header exists and is numeric → else **400**
2) Workspace exists → else **400**
3) User is member of that workspace → else **403**

Then store `workspaceId` for the request (e.g., in container).  
All tenant-owned queries must be filtered by that `workspaceId` (via global scope / explicit where).

---

# Group A — Identity (Global)

## A1) `users`
**Purpose:** Global accounts shared across all workspaces.

**Columns**
- `id BIGINT UNSIGNED PK`
- `name VARCHAR(150) NOT NULL`
- `email VARCHAR(190) NOT NULL UNIQUE`
- `email_verified_at TIMESTAMP NULL`
- `password VARCHAR(255) NOT NULL`
- `remember_token VARCHAR(100) NULL`
- `created_at TIMESTAMP NULL`
- `updated_at TIMESTAMP NULL`

**Relationships**
- User has many `workspace_members`
- User has many assigned `tasks` via `tasks.assigned_to_user_id`
- User has many authored `comments`
- User has many `notifications`
- User has many `audit_logs` (actor)

---

# Group B — Multi-Workspace (Tenancy)

## B1) `workspaces`
**Purpose:** Represents a tenant (team/company/workspace).

**Columns**
- `id BIGINT UNSIGNED PK`
- `name VARCHAR(150) NOT NULL`
- `created_by_user_id BIGINT UNSIGNED NOT NULL FK -> users.id`
- `created_at TIMESTAMP NULL`
- `updated_at TIMESTAMP NULL`

**Relationships**
- Workspace has many `workspace_members`
- Workspace has many `projects`, `tasks`, `notifications`, `audit_logs`, etc.

---

## B2) `workspace_members`
**Purpose:** Membership between users and workspaces + the role inside that workspace.

**Columns**
- `id BIGINT UNSIGNED PK`
- `workspace_id BIGINT UNSIGNED NOT NULL FK -> workspaces.id`
- `user_id BIGINT UNSIGNED NOT NULL FK -> users.id`
- `role_id BIGINT UNSIGNED NOT NULL FK -> roles.id`
- `joined_at TIMESTAMP NULL`
- `created_at TIMESTAMP NULL`
- `updated_at TIMESTAMP NULL`

**Constraints**
- `UNIQUE(workspace_id, user_id)`  ✅ prevents duplicate membership

**Indexes**
- index on `workspace_id`
- index on `user_id`

**Runtime Flow (How it’s used)**
- When request comes with `X-Workspace-Id`, we verify membership by checking:
  - `workspace_members where workspace_id = X and user_id = auth()->id()`
- This table is also where we fetch **the user’s role** for RBAC checks.

---

## B3) `workspace_invites`
**Purpose:** Invite link/token to join a workspace.

**Columns**
- `id BIGINT UNSIGNED PK`
- `workspace_id BIGINT UNSIGNED NOT NULL FK -> workspaces.id`
- `token CHAR(64) NOT NULL UNIQUE`
- `email VARCHAR(190) NULL INDEX` (optional targeted invite)
- `role_id BIGINT UNSIGNED NULL FK -> roles.id` (default role after accept)
- `created_by_user_id BIGINT UNSIGNED NOT NULL FK -> users.id`
- `expires_at DATETIME NULL`
- `used_at DATETIME NULL`
- `created_at TIMESTAMP NULL`
- `updated_at TIMESTAMP NULL`

**Runtime Flow**
1) Admin calls `POST /invites` → creates invite row with random token
2) Someone opens link → `GET /invites/{token}` verifies:
   - token exists
   - not expired
   - not used
3) `POST /invites/{token}/accept`:
   - finds invite
   - creates `workspace_members` row (or updates role if already member)
   - sets `used_at`
4) Optional: if invite has email, validate that accepting user email matches.

---

# Group C — RBAC (Roles & Permissions)

## C1) `permissions`
**Purpose:** Global list of permission keys.

**Columns**
- `id BIGINT UNSIGNED PK`
- `key VARCHAR(120) NOT NULL UNIQUE` (e.g., `task.assign`)
- `description VARCHAR(255) NULL`
- `created_at TIMESTAMP NULL`
- `updated_at TIMESTAMP NULL`

**Note**
- Permissions are global so keys are consistent across all workspaces.

---

## C2) `roles`
**Purpose:** Roles are sets of permissions; roles can be workspace-specific.

**Columns**
- `id BIGINT UNSIGNED PK`
- `workspace_id BIGINT UNSIGNED NULL INDEX/FK -> workspaces.id`
  - `NULL` means “template role” (seeded defaults like Admin/Viewer)
- `name VARCHAR(80) NOT NULL`
- `is_system TINYINT(1) NOT NULL` (seeded default)
- `created_at TIMESTAMP NULL`
- `updated_at TIMESTAMP NULL`

**Runtime Flow**
- When a workspace is created, you can “copy” template roles (workspace_id NULL) into workspace-specific roles.

---

## C3) `role_permissions`
**Purpose:** Pivot table linking roles to permissions.

**Columns**
- `id BIGINT UNSIGNED PK`
- `role_id BIGINT UNSIGNED NOT NULL FK -> roles.id`
- `permission_id BIGINT UNSIGNED NOT NULL FK -> permissions.id`

**Constraints**
- `UNIQUE(role_id, permission_id)` ✅ prevents duplicates

**How you access in Laravel**
- `Role->permissions()` is `belongsToMany(Permission::class, 'role_permissions')`
- You can:
  - List keys: `$role->permissions->pluck('key')`
  - Update from checkbox UI: `$role->permissions()->sync($permissionIds)`

**Authorization Flow (How to “ensure authorized”)**
When the backend wants to check `project.create`:
1) Determine workspace (from header middleware)
2) Find membership: `workspace_members(user_id, workspace_id)` → gives `role_id`
3) Load role permissions:
   - join role_permissions → permissions
4) If permission key exists → allowed; else 403

**Best implementation pattern**
- Central `PermissionService` + `Gate::before()`:
  - so routes can be protected with `->middleware('can:project.create')`
  - no duplication in controllers

---

# Group D — Core Product (Projects, Tasks)

## D1) `projects`
**Purpose:** Projects belong to a workspace.

**Columns**
- `id BIGINT UNSIGNED PK`
- `workspace_id BIGINT UNSIGNED NOT NULL FK -> workspaces.id`
- `name VARCHAR(150) NOT NULL`
- `status VARCHAR(40) NOT NULL INDEX` (optional)
- `created_by_user_id BIGINT UNSIGNED NOT NULL FK -> users.id`
- `deleted_at TIMESTAMP NULL INDEX` (soft delete)
- `created_at TIMESTAMP NULL`
- `updated_at TIMESTAMP NULL`

**Indexes**
- `INDEX(workspace_id, deleted_at)`
- optional: `INDEX(workspace_id, status)`

**Runtime Flow**
- On create: workspace_id is auto-filled from context.
- On queries: must always be filtered by workspace_id (global scope).

---

## D2) `tasks`
**Purpose:** Tasks belong to a project + workspace; include workflow status + assignment.

**Columns**
- `id BIGINT UNSIGNED PK`
- `workspace_id BIGINT UNSIGNED NOT NULL FK -> workspaces.id`
- `project_id BIGINT UNSIGNED NOT NULL FK -> projects.id`
- `title VARCHAR(200) NOT NULL`
- `description TEXT NULL`
- `status VARCHAR(40) NOT NULL INDEX` (Backlog/Ready/...)
- `priority VARCHAR(20) NULL INDEX`
- `due_date DATETIME NULL INDEX`
- `assigned_to_user_id BIGINT UNSIGNED NULL FK -> users.id`
- `created_by_user_id BIGINT UNSIGNED NOT NULL FK -> users.id`
- `deleted_at TIMESTAMP NULL INDEX`
- `created_at TIMESTAMP NULL`
- `updated_at TIMESTAMP NULL`

**Important constraints**
- `project_id` must point to a project in the SAME workspace.
  - You enforce this in code by ensuring project is loaded with workspace scope.

**Runtime Flow**
- Create task:
  1) Authorize `task.create`
  2) Load project by id (scoped by workspace) → ensures cross-tenant safety
  3) Insert task with workspace_id and project_id
  4) Create audit log row (optional early)
- Assign task:
  1) Authorize `task.assign`
  2) Validate assignee is a member in same workspace (workspace_members exists)
  3) Update `assigned_to_user_id`
  4) Create history row (event_type = `assign`)
  5) Trigger notification (assignee)

---

# Group E — Workflow History

## E1) `task_history`
**Purpose:** Stores “what changed” over time for tasks (workflow + more).

**Columns**
- `id BIGINT UNSIGNED PK`
- `workspace_id BIGINT UNSIGNED NOT NULL FK -> workspaces.id`
- `task_id BIGINT UNSIGNED NOT NULL FK -> tasks.id`
- `actor_user_id BIGINT UNSIGNED NOT NULL FK -> users.id`
- `event_type VARCHAR(40) NOT NULL INDEX`
  - examples: `status_change`, `assign`, `due_date_change`, `description_edit`
- `old_value JSON NULL`
- `new_value JSON NULL`
- `meta JSON NULL`
- `created_at TIMESTAMP NULL`

**Indexes**
- `INDEX(task_id, created_at)`
- `INDEX(workspace_id, created_at)`

**Runtime Flow (Status change / workflow engine)**
When `POST /tasks/{id}/status`:
1) Load task (scoped by workspace)
2) Authorize permission:
   - `task.change_status` or special (e.g. `task.submit_review`)
3) Validate transition:
   - check allowed transitions list (state machine)
4) Update `tasks.status`
5) Insert into `task_history`:
   - old_value: `{"status":"Ready"}`
   - new_value: `{"status":"In Progress"}`
6) Insert audit log row (optional early)
7) Trigger notifications (optional)

---

# Group F — Comments & Mentions

## F1) `comments`
**Purpose:** Comments on tasks.

**Columns**
- `id BIGINT UNSIGNED PK`
- `workspace_id BIGINT UNSIGNED NOT NULL FK -> workspaces.id`
- `task_id BIGINT UNSIGNED NOT NULL FK -> tasks.id`
- `user_id BIGINT UNSIGNED NOT NULL FK -> users.id` (author)
- `body TEXT NOT NULL`
- `deleted_at TIMESTAMP NULL INDEX` (optional)
- `created_at TIMESTAMP NULL`
- `updated_at TIMESTAMP NULL`

**Runtime Flow**
When `POST /tasks/{taskId}/comments`:
1) Load task (scoped by workspace)
2) Authorize `comment.create`
3) Insert comment row
4) Parse mentions from body (see next table)
5) Create `comment_mentions` rows
6) Create notifications for mentioned users (based on preferences)

---

## F2) `comment_mentions`
**Purpose:** Many-to-many between a comment and mentioned users.

**Columns**
- `id BIGINT UNSIGNED PK`
- `comment_id BIGINT UNSIGNED NOT NULL FK -> comments.id`
- `mentioned_user_id BIGINT UNSIGNED NOT NULL FK -> users.id`
- `created_at TIMESTAMP NULL`

**Constraints (recommended)**
- `UNIQUE(comment_id, mentioned_user_id)` ✅ prevents duplicate mention rows

### Mention Detection — HOW?
You have 2 common approaches:

#### Option 1 (Simple, good for MVP): `@email` mentions
- You parse `@something` tokens and match against user email or username.
- Example regex:
  - `/(?<!\w)@([a-zA-Z0-9._-]{3,})/`
- Then you map token → user:
  - if token matches username/email prefix.

#### Option 2 (Best UX): `@{userId}` mention tokens
- Frontend mention UI inserts stable tokens:
  - `@{2}` for user id 2
- Backend regex:
  - `/@\{(\d+)\}/`
- This is more reliable (no ambiguity, no rename issues).

**Recommended for your project:** Option 2.
- It makes mention parsing deterministic.

### Mention Flow (End-to-End)
1) User writes comment in UI
2) UI mention component inserts tokens like `@{2}`
3) Backend receives `body`
4) Backend extracts mentioned IDs: `[2, 5, 9]`
5) Backend filters:
   - remove duplicates
   - remove self mention (optional)
   - ensure mentioned users are members in the same workspace
6) Backend inserts `comment_mentions` rows
7) Backend inserts `notifications` for each mentioned user
8) Backend returns response:
   - comment
   - mentioned users list (optional)

**What happens when a row is created?**
- Creating a `comment_mentions` row is not enough by itself.
- The meaningful effect is that it **drives notification creation** and future queries:
  - “Who was mentioned in this comment?”
  - “Show all comments that mentioned me” (optional feature)

---

# Group G — Notifications & Preferences

## G1) `notifications`
**Purpose:** In-app notifications.

**Columns**
- `id BIGINT UNSIGNED PK`
- `workspace_id BIGINT UNSIGNED NOT NULL FK -> workspaces.id`
- `user_id BIGINT UNSIGNED NOT NULL FK -> users.id` (receiver)
- `type VARCHAR(60) NOT NULL INDEX` (e.g. `mention`, `task_assigned`)
- `payload JSON NOT NULL`
  - example payload for mention:
    - `{"comment_id":6001,"task_id":701,"by_user_id":1}`
- `read_at DATETIME NULL INDEX` (null = unread)
- `created_at TIMESTAMP NULL`
- `updated_at TIMESTAMP NULL`

**Indexes**
- `INDEX(user_id, read_at)`
- `INDEX(workspace_id, user_id)`

**Runtime Flow**
- Mention notification:
  - Created after inserting `comment_mentions`
- Assignment notification:
  - Created after updating `tasks.assigned_to_user_id`
- Reading notifications:
  - `PATCH /notifications/{id}/read` sets `read_at = now()`

---

## G2) `notification_preferences`
**Purpose:** User preferences per workspace.

**Columns**
- `id BIGINT UNSIGNED PK`
- `workspace_id BIGINT UNSIGNED NOT NULL FK -> workspaces.id`
- `user_id BIGINT UNSIGNED NOT NULL FK -> users.id`
- `in_app_all TINYINT(1) NOT NULL` (receive all in-app notifications)
- `email_mentions_only TINYINT(1) NOT NULL` (for later queue/email)
- `mute_project_ids JSON NULL` (optional list of project ids)
- `created_at TIMESTAMP NULL`
- `updated_at TIMESTAMP NULL`

**Constraints**
- `UNIQUE(workspace_id, user_id)` recommended (one row per user per workspace)

**How preferences affect notifications**
When creating notification:
1) Load preferences for receiver (workspace_id + user_id)
2) If muted project includes task’s project_id → skip
3) If event type is mention and mentions-only enabled → allow
4) Otherwise decide allow/deny

---

# Group H — Audit Logs (System-wide history)

## H1) `audit_logs`
**Purpose:** Security/compliance trail for important actions across the whole system.

**Columns**
- `id BIGINT UNSIGNED PK`
- `workspace_id BIGINT UNSIGNED NOT NULL FK -> workspaces.id`
- `actor_user_id BIGINT UNSIGNED NOT NULL FK -> users.id`
- `action VARCHAR(80) NOT NULL INDEX` (e.g. `TASK_UPDATED`, `ROLE_PERMISSIONS_SYNCED`)
- `entity_type VARCHAR(60) NOT NULL INDEX` (Task/Project/Role/Member)
- `entity_id VARCHAR(64) NOT NULL INDEX` (store id as string)
- `before_json JSON NULL`
- `after_json JSON NULL`
- `meta_json JSON NULL` (ip, user-agent, etc.)
- `at_utc DATETIME NOT NULL INDEX`
- `created_at TIMESTAMP NULL`
- `updated_at TIMESTAMP NULL`

**Runtime Flow**
- You do NOT manually write audit logging in every controller.
- Instead:
  - create `AuditLogger` service
  - call it from key operations (member role change, permissions sync, status change, delete/restore)
- This keeps controllers clean and ensures consistency.

---

# Group I — Soft Delete & Retention

## I1) Soft delete (how it works)
Tables with `deleted_at`:
- `projects`, `tasks` (and optionally comments)

**Flow**
- `DELETE /tasks/{id}` → sets `deleted_at` (not hard delete)
- `POST /tasks/{id}/restore` → clears deleted_at
- Queries should exclude deleted rows by default (Laravel SoftDeletes)

## I2) Retention purge job
**Goal:** after X days (e.g. 30) permanently delete soft-deleted records.

**Flow**
1) Scheduled command runs daily
2) Deletes rows where `deleted_at < now() - X days`
3) Ensure you delete children safely (tasks before projects, etc.)

---

# Group J — Reporting (Derived data from tables)

Reporting uses:
- `tasks` (due_date, status, assigned_to_user_id)
- `task_history` (to compute cycle time Ready→Done)
- `projects` (grouping)
- `workspace_members` (members list)

**Example report: Overdue**
- overdue tasks = tasks where:
  - due_date < now
  - status not Done/Cancelled
  - deleted_at is null
  - workspace_id = current workspace

**Example report: Cycle time**
- find earliest history entry where status became Ready
- find earliest later entry where status became Done
- cycle time = DoneAt - ReadyAt

---

# ✅ Summary: The 3 Foundations You Must Build First
If you build these first, everything else becomes easy:
1) WorkspaceContext middleware (`X-Workspace-Id`)
2) Global scope / auto workspace scoping trait
3) PermissionService + Gate enforcement

Then build core product tables and features on top.

---

## Appendix — Quick ERD (Text)
- users 1..* workspace_members *..1 workspaces
- workspace_members *..1 roles
- roles *..* permissions via role_permissions
- workspaces 1..* projects 1..* tasks 1..* comments
- comments *..* users via comment_mentions
- tasks 1..* task_history
- users 1..* notifications
- users 1..* audit_logs
