# 🧩 Project Phases — Project Management SaaS (Laravel + Next.js)

This file is a **phased roadmap** to build the project without chaos.
Each phase has:
- **Goal** (what this phase achieves)
- **Deliverables** (what must exist at the end)
- **Definition of Done** (clear checks so you can say: “✅ done”)
- **Suggested duration** (flexible)

> Rule: **One session = one stack** (don’t mix Laravel + Next.js in the same session).
> Rule: **Each day = 1 vertical slice** (1 endpoint end-to-end + validation + permission + small test).

---

## Phase 0 — Setup & Smoke Tests
**Goal:** Make sure the environment and auth flow works.

**Deliverables**
- Repo structure:
  - `backend/` (Laravel)
  - `frontend/` (Next.js)
- MySQL database created and connected
- Sanctum installed and configured for SPA cookies
- CORS configured for Next.js
- `/sanctum/csrf-cookie` works

**Definition of Done**
- `GET /sanctum/csrf-cookie` returns **204**
- You can **Register → Login → Logout** using Postman (or a simple Next page)

**Suggested duration:** 1–2 days

---

## Phase 1 — Multi-Tenancy Core (Workspaces)
**Goal:** Build the **tenant boundary** correctly from day one.

**Deliverables**
- Tables:
  - `workspaces`
  - `workspace_members`
- Workspace context:
  - Header: `X-Workspace-Id`
  - Middleware validates:
    - header exists and valid
    - user is a member of that workspace
- Auto scoping:
  - Trait `BelongsToWorkspace`
  - Global scope filters by `workspace_id`
  - Auto-fill `workspace_id` on create

**Definition of Done**
- Missing `X-Workspace-Id` → **400**
- Invalid `X-Workspace-Id` → **400**
- Not a member → **403**
- Member → requests succeed
- (Most important) Member in Workspace A cannot read Workspace B data, even if IDs are guessed.

**Suggested duration:** 5–7 days

---

## Phase 2 — RBAC (Roles & Permissions)
**Goal:** Authorization that is **permission-based**, not ad-hoc.

**Deliverables**
- Tables:
  - `permissions`
  - `roles`
  - `role_permissions`
- Seeders:
  - All permission keys
  - Template roles: Admin / Manager / Member / Viewer
- Permission checks:
  - `PermissionService` resolves member role → permissions
- Enforcement:
  - `Gate::before()` maps abilities to permission keys
  - Routes protected with `can:permission.key`

**Definition of Done**
- Viewer cannot create/edit/delete projects/tasks (403)
- Admin can do restricted actions
- You can prove it with 3–5 Feature Tests.

**Suggested duration:** 5–7 days

---

## Phase 3 — First Vertical Slice (Workspaces + Members + Invites)
**Goal:** Make the SaaS “real” with teams and onboarding.

**Deliverables**
- Workspaces API:
  - `POST /workspaces` (create, copy template roles, add creator as Admin)
  - `GET /workspaces` (list my workspaces)
- Members API:
  - `GET /members`
  - `PATCH /members/{userId}/role`
  - `DELETE /members/{userId}`
  - rule: **cannot remove last Admin**
- Invites:
  - table `workspace_invites`
  - `POST /invites`
  - `GET /invites/{token}`
  - `POST /invites/{token}/accept`

**Definition of Done**
- You can:
  - create workspace
  - invite a user
  - accept invite
  - change role
  - remove member (except last admin)

**Suggested duration:** 5–8 days

---

## Phase 4 — Core Product (Projects + Tasks + Assignment)
**Goal:** Build the actual “product” layer on top of the platform.

**Deliverables**
- Projects:
  - CRUD
  - soft delete + restore
- Tasks:
  - CRUD
  - soft delete + restore
  - assign task to a single user (`assigned_to_user_id`)
- List endpoints:
  - pagination
  - sorting
  - basic filtering

**Definition of Done**
- In a workspace, you can:
  - create project
  - create tasks under project
  - assign tasks
  - soft delete and restore projects/tasks
- All endpoints respect workspace scoping & permissions.

**Suggested duration:** 7–14 days

---

## Phase 5 — Workflow Engine + Task History
**Goal:** Turn tasks into a **state machine** with rules + history.

**Deliverables**
- Statuses:
  - Backlog, Ready, In Progress, In Review, Blocked, Done, Cancelled
- Transition rules:
  - allowed transitions list
  - forbidden transitions return 422/403 (depending on design)
- History:
  - table `task_history`
  - history records for:
    - status changes
    - assignee changes
    - due date changes
    - description edits (optional early)
- Endpoints:
  - `POST /tasks/{id}/status`
  - `GET /tasks/{id}/history`

**Definition of Done**
- Forbidden transition is blocked reliably
- Allowed transition succeeds
- Every transition creates a history row
- “Done → In Progress” blocked except with special permission/admin rule

**Suggested duration:** 5–8 days

---

## Phase 6 — Collaboration (Comments + Mentions + Notifications)
**Goal:** Add team collaboration features (real app behavior).

**Deliverables**
- Comments:
  - `comments` table + endpoints
- Mentions:
  - detect `@name` patterns
  - store in `comment_mentions`
- Notifications:
  - `notifications` + `notification_preferences`
  - triggers:
    - mention → notify mentioned user
    - task assigned → notify assignee
  - avoid duplicates
  - preferences:
    - mentions-only
    - mute project (optional)

**Definition of Done**
- Comment with @mention generates exactly one notification
- Task assignment generates notification
- Preferences change behavior as expected

**Suggested duration:** 7–10 days

---

## Phase 7 — Audit Logs + Retention Policy
**Goal:** Production-like compliance and safety.

**Deliverables**
- `audit_logs` table
- `AuditLogger` service to log key events:
  - member role changes
  - task status changes
  - permission/role updates
  - deletes/restores
- `GET /audit` endpoint (permission-protected)
- Retention:
  - scheduled purge job deletes soft-deleted rows older than X days

**Definition of Done**
- Key actions create audit records automatically
- Audit endpoint returns correct logs for workspace
- Purge job works on test data

**Suggested duration:** 5–8 days

---

## Phase 8 — Reporting Module
**Goal:** “Manager-level” insights and complex queries.

**Deliverables**
- Reports endpoints:
  - `GET /reports/overdue`
  - `GET /reports/completed?from=&to=`
  - `GET /reports/cycle-time?from=&to=`
- Indexes added to support reporting performance
- Correctness checks on time ranges

**Definition of Done**
- Overdue report matches actual overdue tasks
- Cycle time computed from history (Ready → Done)
- Queries remain fast on seeded data (basic benchmark)

**Suggested duration:** 5–8 days

---

## Phase 9 — Frontend (Next.js UI)
**Goal:** Make it usable end-to-end.

**Deliverables**
- Auth pages (register/login/logout)
- Workspace selector & storage of current workspace id
- Admin screens:
  - members + roles + permissions
- Product UI:
  - projects list/detail
  - tasks list/detail
  - change status UI
  - comments + mentions
  - notifications UI

**Definition of Done**
- You can use the app fully without Postman
- All calls include `credentials: "include"` and `X-Workspace-Id`

**Suggested duration:** 1–3 weeks (depends on UI depth)

---

## Optional Phase 10 — Production Readiness Extras
Add when you feel stable:
- Rate limiting (auth/invites)
- Queue worker for email notifications
- Observability (structured logs)
- CI pipeline
- Realtime updates (optional)

---

## Suggested Build Strategy (Anti-Procrastination)
- **Sprint 1 (Week 1–2):** Phases 0–2 (Platform foundation)
- **Sprint 2 (Week 3):** Phase 3 (Workspaces/Members/Invites)
- **Sprint 3 (Week 4–5):** Phase 4 (Projects/Tasks)
- **Sprint 4 (Week 6):** Phase 5 (Workflow/History)
- **Sprint 5 (Week 7):** Phases 6–8 (Collab + Audit + Reports)
- **Sprint 6+:** Phase 9 UI improvements + optional extras

---

## Your “North Star” Checklist
If these are true, the project is already impressive:
- ✅ Tenant isolation is correct (no cross-workspace data leaks)
- ✅ Permission enforcement is consistent
- ✅ Workflow transitions are rule-driven + recorded in history
- ✅ Mentions generate notifications with preferences
- ✅ Reporting works and is correct
