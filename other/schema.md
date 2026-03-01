# 📚 Database Schema — Tables, Columns, Types, Relations, Purpose (MySQL)
✅ Using **NORMAL IDs** (`BIGINT UNSIGNED`) for all tables  
✅ Workspace identification for frontend is also **BIGINT** in `X-Workspace-Id`

> Notes:
- IDs: `BIGINT UNSIGNED AUTO_INCREMENT`
- Tenant isolation: `workspace_id` in every tenant-owned table
- Soft delete: `deleted_at TIMESTAMP NULL`
- JSON: `JSON`
- Timestamps: `created_at`, `updated_at`

---

# ✅ Relationships (Explained in plain English)

## Workspaces & Members (Multi-workspace SaaS)
### Workspace ↔ Members
- **Each workspace has many members**
- **Each user can belong to many workspaces**
- This many-to-many relationship is stored in `workspace_members`

Relations:
- `workspaces (1) -> (many) workspace_members`
- `users (1) -> (many) workspace_members`
- `roles (1) -> (many) workspace_members`

Meaning:
- Each record in `workspace_members` means:
  - user X is a member of workspace Y
  - with role Z (inside that workspace)

---

## Roles & Permissions (Custom RBAC)
### Role ↔ Permissions
- **Each role has many permissions**
- **Each permission can belong to many roles**
- This many-to-many relationship is stored in `role_permissions`

Relations:
- `roles (1) -> (many) role_permissions`
- `permissions (1) -> (many) role_permissions`
- `roles (many) <-> (many) permissions` through `role_permissions`

---

## Workspace content (Projects, Tasks, Comments)
### Workspace ↔ Projects
- **Each workspace has many projects**
Relation:
- `workspaces (1) -> (many) projects`

### Project ↔ Tasks
- **Each project has many tasks**
Relation:
- `projects (1) -> (many) tasks`

### Task ↔ Comments
- **Each task has many comments**
Relation:
- `tasks (1) -> (many) comments`

---

## Task Assignment
### User ↔ Assigned Tasks
- **Each user can be assigned many tasks**
- **Each task can have 1 assigned user (or null)**
Relation:
- `users (1) -> (many) tasks` via `tasks.assigned_to_user_id`

---

## Task Workflow History
### Task ↔ Task History
- **Each task has many history records**
- Every important change creates a new history row (status change, assign, due date change, etc.)
Relation:
- `tasks (1) -> (many) task_history`

---

## Mentions in comments
### Comment ↔ Mentioned users
- **Each comment can mention many users**
- **Each user can be mentioned many times**
Relation:
- `comments (1) -> (many) comment_mentions`
- `users (1) -> (many) comment_mentions`

---

## Notifications & Preferences
### User ↔ Notifications
- **Each user can have many notifications**
Relation:
- `users (1) -> (many) notifications`

### Workspace ↔ Notifications
- **Each workspace can have many notifications**
Relation:
- `workspaces (1) -> (many) notifications`

### Preferences
- **Each user can have 1 preferences row per workspace**
Relation:
- `users (1) -> (many) notification_preferences`
- `workspaces (1) -> (many) notification_preferences`

---

## Audit Logs
### Workspace ↔ Audit Logs
- **Each workspace has many audit logs**
Relation:
- `workspaces (1) -> (many) audit_logs`

### User ↔ Audit Logs
- **Each user can generate many audit logs**
Relation:
- `users (1) -> (many) audit_logs` via `actor_user_id`

---

# ✅ Tables

---

## 1) `users`
**Purpose:** Global user accounts (not tenant-scoped).

| Column | Type | Null | Key | Notes |
|---|---|---:|---|---|
| id | BIGINT UNSIGNED | NO | PK | auto increment |
| name | VARCHAR(150) | NO |  |  |
| email | VARCHAR(190) | NO | UNIQUE |  |
| email_verified_at | TIMESTAMP | YES |  |  |
| password | VARCHAR(255) | NO |  | hashed |
| remember_token | VARCHAR(100) | YES |  | optional |
| created_at | TIMESTAMP | YES |  |  |
| updated_at | TIMESTAMP | YES |  |  |

---

## 2) `workspaces`
**Purpose:** Tenants (workspace/team/company).

| Column | Type | Null | Key | Notes |
|---|---|---:|---|---|
| id | BIGINT UNSIGNED | NO | PK | auto increment |
| name | VARCHAR(150) | NO |  |  |
| created_by_user_id | BIGINT UNSIGNED | NO | FK | → users.id |
| created_at | TIMESTAMP | YES |  |  |
| updated_at | TIMESTAMP | YES |  |  |

---

## 3) `workspace_members`
**Purpose:** Membership between users and workspaces + role per workspace.

| Column | Type | Null | Key | Notes |
|---|---|---:|---|---|
| id | BIGINT UNSIGNED | NO | PK | auto increment |
| workspace_id | BIGINT UNSIGNED | NO | FK | → workspaces.id |
| user_id | BIGINT UNSIGNED | NO | FK | → users.id |
| role_id | BIGINT UNSIGNED | NO | FK | → roles.id |
| joined_at | TIMESTAMP | YES |  | optional |
| created_at | TIMESTAMP | YES |  |  |
| updated_at | TIMESTAMP | YES |  |  |

**Unique constraint (required):**
- `(workspace_id, user_id)` must be unique

---

## 4) `permissions`
**Purpose:** Global list of permission keys.

| Column | Type | Null | Key | Notes |
|---|---|---:|---|---|
| id | BIGINT UNSIGNED | NO | PK | auto increment |
| key | VARCHAR(120) | NO | UNIQUE | e.g. `task.change_status` |
| description | VARCHAR(255) | YES |  | optional |
| created_at | TIMESTAMP | YES |  |  |
| updated_at | TIMESTAMP | YES |  |  |

---

## 5) `roles`
**Purpose:** Custom roles per workspace + template roles.

| Column | Type | Null | Key | Notes |
|---|---|---:|---|---|
| id | BIGINT UNSIGNED | NO | PK | auto increment |
| workspace_id | BIGINT UNSIGNED | YES | INDEX/FK | NULL = template role |
| name | VARCHAR(80) | NO |  | Admin / Viewer |
| is_system | TINYINT(1) | NO |  | seeded default |
| created_at | TIMESTAMP | YES |  |  |
| updated_at | TIMESTAMP | YES |  |  |

---

## 6) `role_permissions`
**Purpose:** Connect roles to permissions.

| Column | Type | Null | Key | Notes |
|---|---|---:|---|---|
| id | BIGINT UNSIGNED | NO | PK | auto increment |
| role_id | BIGINT UNSIGNED | NO | FK | → roles.id |
| permission_id | BIGINT UNSIGNED | NO | FK | → permissions.id |

**Unique constraint (required):**
- `(role_id, permission_id)` unique

---

## 7) `workspace_invites`
**Purpose:** Invite link/token to join workspace.

| Column | Type | Null | Key | Notes |
|---|---|---:|---|---|
| id | BIGINT UNSIGNED | NO | PK | auto increment |
| workspace_id | BIGINT UNSIGNED | NO | FK | → workspaces.id |
| token | CHAR(64) | NO | UNIQUE | random token |
| email | VARCHAR(190) | YES | INDEX | optional targeted |
| role_id | BIGINT UNSIGNED | YES | FK | role assigned on accept |
| created_by_user_id | BIGINT UNSIGNED | NO | FK | → users.id |
| expires_at | DATETIME | YES |  | optional |
| used_at | DATETIME | YES |  | when accepted |
| created_at | TIMESTAMP | YES |  |  |
| updated_at | TIMESTAMP | YES |  |  |

---

## 8) `projects`
**Purpose:** Workspace projects.

| Column | Type | Null | Key | Notes |
|---|---|---:|---|---|
| id | BIGINT UNSIGNED | NO | PK | auto increment |
| workspace_id | BIGINT UNSIGNED | NO | FK | → workspaces.id |
| name | VARCHAR(150) | NO |  |  |
| status | VARCHAR(40) | NO | INDEX | optional |
| created_by_user_id | BIGINT UNSIGNED | NO | FK | → users.id |
| deleted_at | TIMESTAMP | YES | INDEX | soft delete |
| created_at | TIMESTAMP | YES |  |  |
| updated_at | TIMESTAMP | YES |  |  |

---

## 9) `tasks`
**Purpose:** Workspace tasks inside projects (workflow + assignee).

| Column | Type | Null | Key | Notes |
|---|---|---:|---|---|
| id | BIGINT UNSIGNED | NO | PK | auto increment |
| workspace_id | BIGINT UNSIGNED | NO | FK | → workspaces.id |
| project_id | BIGINT UNSIGNED | NO | FK | → projects.id |
| title | VARCHAR(200) | NO |  |  |
| description | TEXT | YES |  |  |
| status | VARCHAR(40) | NO | INDEX | Backlog/Ready/... |
| priority | VARCHAR(20) | YES | INDEX | optional |
| due_date | DATETIME | YES | INDEX | optional |
| assigned_to_user_id | BIGINT UNSIGNED | YES | FK | → users.id |
| created_by_user_id | BIGINT UNSIGNED | NO | FK | → users.id |
| deleted_at | TIMESTAMP | YES | INDEX | soft delete |
| created_at | TIMESTAMP | YES |  |  |
| updated_at | TIMESTAMP | YES |  |  |

---

## 10) `task_history`
**Purpose:** Track task changes (workflow engine + history).

| Column | Type | Null | Key | Notes |
|---|---|---:|---|---|
| id | BIGINT UNSIGNED | NO | PK | auto increment |
| workspace_id | BIGINT UNSIGNED | NO | FK | → workspaces.id |
| task_id | BIGINT UNSIGNED | NO | FK | → tasks.id |
| actor_user_id | BIGINT UNSIGNED | NO | FK | → users.id |
| event_type | VARCHAR(40) | NO | INDEX | status_change, assign |
| old_value | JSON | YES |  |  |
| new_value | JSON | YES |  |  |
| meta | JSON | YES |  | optional |
| created_at | TIMESTAMP | YES |  |  |

---

## 11) `comments`
**Purpose:** Task comments (supports mentions).

| Column | Type | Null | Key | Notes |
|---|---|---:|---|---|
| id | BIGINT UNSIGNED | NO | PK | auto increment |
| workspace_id | BIGINT UNSIGNED | NO | FK | → workspaces.id |
| task_id | BIGINT UNSIGNED | NO | FK | → tasks.id |
| user_id | BIGINT UNSIGNED | NO | FK | → users.id |
| body | TEXT | NO |  |  |
| deleted_at | TIMESTAMP | YES | INDEX | optional |
| created_at | TIMESTAMP | YES |  |  |
| updated_at | TIMESTAMP | YES |  |  |

---

## 12) `comment_mentions`
**Purpose:** Store detected @mentions from comments.

| Column | Type | Null | Key | Notes |
|---|---|---:|---|---|
| id | BIGINT UNSIGNED | NO | PK | auto increment |
| comment_id | BIGINT UNSIGNED | NO | FK | → comments.id |
| mentioned_user_id | BIGINT UNSIGNED | NO | FK | → users.id |
| created_at | TIMESTAMP | YES |  |  |

---

## 13) `notifications`
**Purpose:** In-app notifications.

| Column | Type | Null | Key | Notes |
|---|---|---:|---|---|
| id | BIGINT UNSIGNED | NO | PK | auto increment |
| workspace_id | BIGINT UNSIGNED | NO | FK | → workspaces.id |
| user_id | BIGINT UNSIGNED | NO | FK | → users.id |
| type | VARCHAR(60) | NO | INDEX | mention/task_assigned |
| payload | JSON | NO |  |  |
| read_at | DATETIME | YES | INDEX | null = unread |
| created_at | TIMESTAMP | YES |  |  |
| updated_at | TIMESTAMP | YES |  |  |

---

## 14) `notification_preferences`
**Purpose:** Preferences per user per workspace (mute, mentions-only).

| Column | Type | Null | Key | Notes |
|---|---|---:|---|---|
| id | BIGINT UNSIGNED | NO | PK | auto increment |
| workspace_id | BIGINT UNSIGNED | NO | FK | → workspaces.id |
| user_id | BIGINT UNSIGNED | NO | FK | → users.id |
| in_app_all | TINYINT(1) | NO |  | 1/0 |
| email_mentions_only | TINYINT(1) | NO |  | 1/0 |
| mute_project_ids | JSON | YES |  | optional |
| created_at | TIMESTAMP | YES |  |  |
| updated_at | TIMESTAMP | YES |  |  |

**Unique constraint (recommended):**
- `(workspace_id, user_id)` unique

---

## 15) `audit_logs`
**Purpose:** Security/compliance trail of important actions.

| Column | Type | Null | Key | Notes |
|---|---|---:|---|---|
| id | BIGINT UNSIGNED | NO | PK | auto increment |
| workspace_id | BIGINT UNSIGNED | NO | FK | → workspaces.id |
| actor_user_id | BIGINT UNSIGNED | NO | FK | → users.id |
| action | VARCHAR(80) | NO | INDEX | e.g. TASK_UPDATED |
| entity_type | VARCHAR(60) | NO | INDEX | Task/Project/Role |
| entity_id | VARCHAR(64) | NO | INDEX | store as string |
| before_json | JSON | YES |  |  |
| after_json | JSON | YES |  |  |
| meta_json | JSON | YES |  | ip/user-agent |
| at_utc | DATETIME | NO | INDEX |  |
| created_at | TIMESTAMP | YES |  | optional |
| updated_at | TIMESTAMP | YES |  | optional |

---

# ✅ Indexing Checklist (Performance)
- [ ] `users(email)` unique
- [ ] `workspace_members(workspace_id, user_id)` unique
- [ ] `permissions(key)` unique
- [ ] `role_permissions(role_id, permission_id)` unique
- [ ] `projects(workspace_id, deleted_at)` index
- [ ] `tasks(workspace_id, project_id, status)` index
- [ ] `tasks(assigned_to_user_id)` index
- [ ] `task_history(task_id, created_at)` index
- [ ] `notifications(user_id, read_at)` index
- [ ] `audit_logs(workspace_id, at_utc)` index
