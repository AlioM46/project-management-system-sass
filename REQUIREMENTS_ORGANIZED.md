# 📘 Project Requirements — Organized Version

## 📌 Table of Contents
1. Goal
2. Tech Stack
3. Multi-Tenancy
4. Core Concepts
5. Functional Requirements
6. Non-Functional Requirements

---

# Requirements — Project Management SaaS (Multi-Workspace, Permissions, Workflow)

## Goal
Not “more features for the sake of it”.
Build a real SaaS with:
- real constraints
- real architecture patterns
- real scale/security problems

---

## Tech Stack
### Frontend
- Next.js (React)
- Fetch/Axios client with cookies
- Sends `X-Workspace-Id` header on workspace-scoped requests

### Backend
- Laravel (API)
- Sanctum (SPA cookie auth)
- MySQL (phpMyAdmin)
- Queue (later) for email + async notifications

### Multi-tenancy
- Single DB
- Shared tables
- Tenant isolation by `workspace_id` + workspace middleware + global scope

---

## Core Concepts (must-have)
### 1) Multi-Workspace + Multi-Role (Real SaaS)
- A user can belong to many workspaces
- In each workspace, the user can have a different role

Examples:
- In “Zenon Studio” user is Admin
- In “Client X” user is Viewer

Requirement:
- Every request must respect workspace context

---

### 2) Fine-grained Permissions (Not just roles)
- Permissions are defined as keys like:
  - `project.create`
  - `project.delete`
  - `task.assign`
  - `task.change_status`
  - `comment.delete_any`

- Roles are sets of permissions
- Roles are workspace-specific (custom roles per workspace)

Requirement:
- Admin (customer) can manage:
  - create/update/delete roles
  - assign permissions to roles

---

### 3) Task Workflow Engine (State machine)
Statuses (minimum):
- Backlog
- Ready
- In Progress
- In Review
- Blocked
- Done
- Cancelled

Rules:
- Only certain transitions allowed (example):
  - Backlog → Ready ✅
  - Done → In Progress ❌ (unless Admin or special permission)
- Some transitions require permissions:
  - moving to In Review requires `task.submit_review` (or similar)

Requirement:
- Transitions must be enforced consistently
- Transitions must be recorded in history

---

### 4) Audit Trail + History (who changed what)
Every important change creates a record:
- task status changed
- assignee changed
- due date changed
- description edited
- role permissions changed
- member removed/role changed

Store for each record:
- old value
- new value
- who changed it
- when
- entity type + id

Requirement:
- Should not be manually coded everywhere → use clean pattern/service

---

### 5) Soft Delete + Restore + Retention
Instead of hard delete:
- soft delete tasks/projects/comments
- support restore

Retention:
- auto purge soft-deleted data after X days (ex: 30)

Requirement:
- permissions must control delete/restore
- queries must respect soft delete

---

### 6) Mentions + Notifications + Preferences
Mentions in comments:
- Example: “@Ali please review this”

System must:
- detect mentions
- notify mentioned users
- notify watchers (optional)
- avoid duplicates
- support notification preferences:
  - email on mentions only
  - in-app on everything
  - mute a project

Requirement:
- mention parsing + preference rules
- use queue for email (later)

---

## Recommended “Perfect Difficulty Upgrade” (MVP+)
Implement these 5 as the best realistic challenge:
1) Multi-workspace + membership access control
2) Permissions model (custom roles)
3) Workflow engine (state transitions + history)
4) Notifications (mentions + preferences + queue later)
5) Reporting (cycle time + overdue + activity)

---

## Functional Requirements (What users can do)
### Authentication
- Register
- Login
- Logout
- Session/cookie auth via Sanctum

### Workspaces
- Create workspace manually
- Join workspace via invite link/token
- List user workspaces
- Switch workspace context in frontend

### Members
- Invite members
- Accept invite (join)
- Change member role
- Remove member
- Prevent removing last Admin (rule)

### Roles & Permissions
- List permissions
- Create custom role per workspace
- Update role name
- Delete role (with constraints)
- Sync role permissions (checkbox style)
- Enforce permissions on every route

### Projects
- CRUD projects
- Workspace-scoped data isolation

### Tasks
- CRUD tasks
- Assign task to single member
- Workflow transitions (with rules)
- History records for changes

### Comments
- Add comments
- Mention users in comments
- Delete comment (author OR permission delete_any)

### Notifications
- In-app notifications for key events
- Email notifications later via queue
- Preferences: mention-only, mute, etc.

### Audit
- View activity/audit log (permission-protected)

### Reports (manager-level)
- overdue tasks by project
- tasks completed per user per week
- cycle time (Ready → Done)
- activity summary per time range

---

## Non-Functional Requirements
- Standard JSON response shape for all endpoints
- Validation via FormRequests (no inline validation)
- Workspace isolation enforced via middleware + global scope
- Strong authorization (no duplicated permission logic everywhere)
- Pagination + sorting for list endpoints
- Unit/integration tests for critical security flows

