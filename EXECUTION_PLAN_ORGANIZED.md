
# 📗 Project Execution Plan — Organized Version

## 📌 Table of Contents
1. Project Overview
2. Workflow Phases
3. Backend Setup
4. Multi-Tenancy & RBAC
5. Core Features
6. Advanced Features
7. Frontend Setup
8. Testing & Production Readiness

---

# ✅ Project Management SaaS (Next.js + Laravel + Sanctum + MySQL)
> **Structure:** Default Laravel (Controllers / Models / Services / Middleware / Requests / Policies)  
> **Multi-tenancy:** Workspaces (Tenant) using **X-Workspace-Id** header  
> **Auth:** Laravel **Sanctum SPA (Cookies)**  
> **Roles/Permissions:** Custom roles per workspace (Admin can manage)  
> **Workflow:** Task state machine + transition rules + history  
> **Audit/History:** Track “who changed what”  
> **Mentions/Notifications:** @mentions + preferences (in-app + email later)  
> **Soft Delete/Retention:** Restore + purge policy  
> **Reporting:** cycle time + overdue + productivity  
> **Realtime (optional):** live updates later  
> **Assignment:** Single `assigned_to_user_id` (MVP)

---

# ✅ Project Workflow (How to build it without chaos)
- [ ] Phase 1 — Foundation: backend + auth + API standards
- [ ] Phase 2 — Multi-tenancy core: workspace tables + middleware + global scope
- [ ] Phase 3 — RBAC: permissions + roles + gate enforcement
- [ ] Phase 4 — First Vertical Slice: workspaces + invites + members + roles UI endpoints
- [ ] Phase 5 — Core Product: projects + tasks + assignment
- [ ] Phase 6 — Workflow Engine: transitions + history + rules + permissions
- [ ] Phase 7 — Collaboration: comments + mentions + notifications + preferences
- [ ] Phase 8 — Audit + Soft delete + Retention: restore + purge job
- [ ] Phase 9 — Reporting: overdue + completed + cycle time
- [ ] Phase 10 — Frontend UI: auth + workspace switch + admin panels + projects/tasks
- [ ] Phase 11 — Testing + Hardening: isolation + permissions + workflow correctness
- [ ] Phase 12 — Production readiness: rate limits + queues + CI + optional realtime

---

# 0) Project Setup (Repo + Apps)
- [ ] Create a new Git repository
- [ ] Create folders:
  - [ ] `backend/` (Laravel)
  - [ ] `frontend/` (Next.js)
- [ ] Add `.gitignore` for both apps
- [ ] Add a root `README.md` (setup steps)

---

# 1) Backend Setup (Laravel + MySQL)
## 1.1 Create Laravel Project
- [ ] `cd backend`
- [ ] Create Laravel project
- [ ] Copy `.env.example` → `.env`
- [ ] Generate app key: `php artisan key:generate`
- [ ] Run server once: `php artisan serve`

## 1.2 Configure MySQL (phpMyAdmin)
- [ ] Create a MySQL database (example: `pm_saas`)
- [ ] Update `.env` DB vars
- [ ] Run migrations (smoke test): `php artisan migrate`

---

# 2) Install & Configure Sanctum (SPA Cookies)
## 2.1 Install Sanctum
- [ ] `composer require laravel/sanctum`
- [ ] Publish Sanctum: `php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"`
- [ ] Run migrations: `php artisan migrate`

## 2.2 Configure Sanctum for Next.js SPA
- [ ] Set in `.env`:
  - [ ] `SANCTUM_STATEFUL_DOMAINS=localhost:3000`
  - [ ] `SESSION_DOMAIN=localhost`

## 2.3 Configure CORS
- [ ] Update `config/cors.php`:
  - [ ] `paths` includes `api/*` and `sanctum/csrf-cookie`
  - [ ] `allowed_origins` includes `http://localhost:3000`
  - [ ] `supports_credentials => true`

## 2.4 Test CSRF Cookie
- [ ] Run backend: `php artisan serve`
- [ ] Test: `GET http://localhost:8000/sanctum/csrf-cookie` returns 204

---

# 3) API Standards (World-class responses & validation)
## 3.1 Standard Response Shape
- [x] Create `app/Http/Responses/ApiResponse.php`
- [x] Use success/error format everywhere

## 3.2 Validation Standard
- [ ] Use `FormRequest` for every input route
- [ ] Avoid `$request->validate()` in controllers

## 3.3 Global Exception Handling
- [ ] Standardize 401/403/404/500 JSON responses for API

---

# 4) Core Multi-Tenancy (Workspaces)
## 4.1 Tenant Rule
- [ ] Ensure every tenant-owned table has `workspace_id`

## 4.2 Workspace Context Header
- [ ] Use header: `X-Workspace-Id`
- [ ] Ensure frontend sends it for all workspace-scoped requests

---

# 5) Database Tables (Core RBAC + Workspaces)
## 5.1 Create Migrations
- [ ] `workspaces` (uuid id, name)
- [ ] `workspace_members` (workspace_id, user_id, role_id) + composite PK
- [ ] `roles` (workspace_id nullable for templates)
- [ ] `permissions` (key unique)
- [ ] `role_permissions` (role_id, permission_id) + composite PK

## 5.2 Run Migrations
- [ ] `php artisan migrate`

---

# 6) Seed Data (Permissions + Template Roles)
## 6.1 Seed Permissions
- [ ] Create `PermissionSeeder`
- [ ] Seed all required permission keys (members/roles/projects/tasks/comments/audit/reports)

## 6.2 Seed Template Roles
- [ ] Create `RoleSeeder`
- [ ] Seed: Admin / Manager / Member / Viewer
- [ ] Map permissions to each role

## 6.3 Run Seeders
- [ ] Add to `DatabaseSeeder`
- [ ] Run: `php artisan db:seed`

---

# 7) Workspace Context Middleware
## 7.1 Implement Middleware
- [ ] Create `app/Http/Middleware/WorkspaceContext.php`
- [ ] Validate header UUID
- [ ] Verify membership in `workspace_members`
- [ ] Store workspace id in container (`app()->instance(...)`)
- [ ] Return:
  - [ ] 400 for missing/invalid header
  - [ ] 403 for not-a-member

## 7.2 Register Middleware
- [ ] Register in API group after auth

---

# 8) Auto Workspace Scoping (Global Scope)
## 8.1 Trait
- [ ] Create `app/Models/Concerns/BelongsToWorkspace.php`
- [ ] Global scope filters by workspace_id
- [ ] Auto-fill workspace_id on create

## 8.2 Apply Trait
- [ ] Project
- [ ] Task
- [ ] Comment
- [ ] Notification
- [ ] AuditLog
- [ ] TaskHistory / WorkflowEvent

---

# 9) Permission System (Custom Roles per Workspace)
## 9.1 PermissionService
- [ ] Create `app/Services/Auth/PermissionService.php`
- [ ] Implement permission check (workspace member role → role_permissions → permissions.key)

## 9.2 Gates
- [ ] Use `Gate::before()` to map `$ability` to permission key
- [ ] Protect routes with `->middleware('can:permission.key')`

---

# 10) Workspace Feature (First Vertical Slice)
## 10.1 Workspaces API
- [ ] `POST /workspaces` (create + copy template roles + add creator Admin)
- [ ] `GET /workspaces` (list my workspaces)

## 10.2 Members API
- [ ] `GET /members`
- [ ] `PATCH /members/{userId}/role` (member.change_role)
- [ ] `DELETE /members/{userId}` (member.remove)
- [ ] Enforce “cannot remove last Admin”

---

# 11) Invite Links (Join via token)
## 11.1 Table
- [ ] Create `workspace_invites` table (token, expires_at, used_at)

## 11.2 Endpoints
- [ ] `POST /invites` (member.invite)
- [ ] `GET /invites/{token}`
- [ ] `POST /invites/{token}/accept`

---

# 12) Roles + Permissions Admin APIs
- [ ] `GET /permissions`
- [ ] `GET /roles`
- [ ] `POST /roles` (role.create)
- [ ] `PATCH /roles/{roleId}` (role.update)
- [ ] `DELETE /roles/{roleId}` (role.delete)
- [ ] `PUT /roles/{roleId}/permissions` (role.permissions.manage)

---

# 13) Projects (CRUD + Soft Delete/Restore)
## 13.1 Table
- [ ] Create `projects` table + soft deletes

## 13.2 Endpoints
- [ ] `GET /projects`
- [ ] `POST /projects` (project.create)
- [ ] `GET /projects/{id}`
- [ ] `PATCH /projects/{id}` (project.update)
- [ ] `DELETE /projects/{id}` (project.delete) => soft delete
- [ ] `POST /projects/{id}/restore` (project.restore)

---

# 14) Tasks (CRUD + Assign + Soft Delete/Restore)
## 14.1 Table
- [ ] Create `tasks` table + soft deletes (assigned_to_user_id)

## 14.2 Endpoints
- [ ] `GET /projects/{projectId}/tasks`
- [ ] `POST /projects/{projectId}/tasks` (task.create)
- [ ] `GET /tasks/{id}`
- [ ] `PATCH /tasks/{id}` (task.update)
- [ ] `DELETE /tasks/{id}` (task.delete) => soft delete
- [ ] `POST /tasks/{id}/restore` (task.restore)
- [ ] `PATCH /tasks/{id}/assign` (task.assign)

---

# 15) Workflow Engine + Task History
## 15.1 Statuses
- [ ] Backlog / Ready / In Progress / In Review / Blocked / Done / Cancelled

## 15.2 Allowed Transitions Rules
- [ ] Backlog -> Ready
- [ ] Ready -> In Progress
- [ ] In Progress -> In Review
- [ ] In Review -> Done
- [ ] Done -> In Progress (blocked unless Admin/special permission)
- [ ] Any -> Blocked (optional)
- [ ] Blocked -> In Progress (optional)

## 15.3 History Table
- [ ] Create `task_history` or `workflow_events` table

## 15.4 Endpoints
- [ ] `POST /tasks/{id}/status` (task.change_status / task.submit_review)
- [ ] `GET /tasks/{id}/history`
- [ ] Record history on every transition

---

# 16) Audit Log
- [ ] Create `audit_logs` table
- [ ] Create `AuditLogger` service
- [ ] Log key events (workspace/members/roles/projects/tasks/workflow/comments)
- [ ] `GET /audit` (audit.view)

---

# 17) Comments + Mentions
## 17.1 Tables
- [ ] Create `comments` table
- [ ] Create `comment_mentions` table

## 17.2 Endpoints
- [ ] `GET /tasks/{taskId}/comments`
- [ ] `POST /tasks/{taskId}/comments` (comment.create) + parse @mentions
- [ ] `DELETE /comments/{id}` (author OR comment.delete_any)

---

# 18) Notifications + Preferences
## 18.1 Tables
- [ ] Create `notifications` table
- [ ] Create `notification_preferences` table (mute project, mentions-only, etc)

## 18.2 Endpoints
- [ ] `GET /notifications` (notification.view)
- [ ] `PATCH /notifications/{id}/read`
- [ ] `PATCH /notifications/read-all`
- [ ] `GET /notification-preferences`
- [ ] `PATCH /notification-preferences`

## 18.3 Triggers
- [ ] Task assigned -> notify assignee
- [ ] Mention -> notify mentioned user
- [ ] Workflow change -> notify watchers (optional)

---

# 19) Retention Policy
- [ ] Add scheduled job/command: purge soft-deleted records older than 30 days
- [ ] Add config `retention_days`

---

# 20) Reporting
- [ ] `GET /reports/overdue` (report.view)
- [ ] `GET /reports/completed?from=&to=` (report.view)
- [ ] `GET /reports/cycle-time?from=&to=` (report.view)
- [ ] Add required indexes for reporting performance

---

# 21) Frontend Setup (Next.js)
## 21.1 Create Next.js App
- [ ] Create Next.js project
- [ ] Install Tailwind
- [ ] Create API client helper:
  - [ ] `credentials: "include"`
  - [ ] auto-add `X-Workspace-Id`

## 21.2 Auth UI
- [ ] Call `/sanctum/csrf-cookie` before login/register
- [ ] Register page
- [ ] Login page
- [ ] Logout

## 21.3 Workspace UI
- [ ] Workspaces list
- [ ] Create workspace
- [ ] Join workspace (invite token)
- [ ] Workspace selector (store selected workspace id)

## 21.4 Admin UI
- [ ] Roles CRUD UI
- [ ] Permissions sync UI (checkboxes)
- [ ] Members role change/remove UI

## 21.5 Product UI
- [ ] Projects pages
- [ ] Tasks pages
- [ ] Workflow status change UI
- [ ] Comments UI (+ mentions)
- [ ] Notifications UI

---

# 22) Testing
- [ ] Auth tests
- [ ] Workspace header missing/invalid
- [ ] Membership enforcement
- [ ] Permission allow/deny
- [ ] Tenant isolation
- [ ] Invite accept flow
- [ ] Workflow transitions valid/invalid
- [ ] Task history records created
- [ ] Mentions parsing
- [ ] Notification triggers and preference rules

---

# 23) Production Readiness (Later)
- [ ] Rate limiting (auth, invites)
- [ ] Pagination + filters
- [ ] Queue worker (email)
- [ ] Observability logs
- [ ] CI pipeline
- [ ] Realtime updates (optional)

