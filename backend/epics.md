# Tasks Epic — Execution Plan for Codex AI

Implement the Tasks module (Features 5.1–5.8) and a Comments module, following the existing Projects module architecture (`app/Modules/Projects/`).

---

## Why this structure?

The codebase follows a **modular architecture** where each domain lives under `app/Modules/{Module}/` with its own:
- `Model/` — Eloquent models with `BelongsToWorkspace` trait
- `Database/Migrations/` — module-scoped migrations
- `Actions/` — single-responsibility action classes (called by controllers)
- `Services/` — business logic (validation, guards, queries)
- `Http/Controllers/` — thin controllers using `ApiResponse`
- `Http/Requests/` — form request validation
- `Http/routes.php` — module routes with `auth:api`, `workspace.context`, and `hasPermission:` middleware
- `Exceptions/` — domain-specific exception class
- `{Module}ServiceProvider.php` — registers migrations + routes

All modules use `WorkspaceContextService` for tenant scoping, `SoftDeletes` for deletions, and `DB::transaction()` for writes. Permissions are already defined in `PermissionCatalogService::PERMISSION_MATRIX` under `task.*` and `comment.*`.

---

## Phase 1 — Database (Migrations)

### Step 1.1 — Create `tasks` table migration
**File:** `app/Modules/Tasks/Database/Migrations/2026_04_13_000001_create_tasks_table.php`

| Column | Type | Notes |
|---|---|---|
| id | bigIncrements | PK |
| workspace_id | foreignId → workspaces | indexed |
| project_id | foreignId → projects | indexed |
| title | string(255) | required |
| description | text | nullable |
| status | string(20) | default `'todo'`, values: `todo`, `in_progress`, `done` |
| created_by_user_id | foreignId → users | |
| timestamps | | |
| softDeletes | | |

**Indexes:** `(workspace_id)`, `(workspace_id, deleted_at)`, `(project_id)`, `(status)`

**Why:** Matches the data model in epics.md. Uses `SoftDeletes` to align with Feature 5.5 (soft delete). Status stored as string for readability and easy extension.

### Step 1.2 — Create `task_assignments` table migration
**File:** `app/Modules/Tasks/Database/Migrations/2026_04_13_000002_create_task_assignments_table.php`

| Column | Type | Notes |
|---|---|---|
| id | bigIncrements | PK |
| task_id | foreignId → tasks | cascadeOnDelete |
| user_id | foreignId → users | |
| assigned_by_user_id | foreignId → users | |
| created_at | timestamp | |

**Unique constraint:** `(task_id, user_id)`

**Why:** Epics.md specifies this exact model with the unique constraint. `assigned_by_user_id` tracks who performed the assignment for audit purposes.

### Step 1.3 — Create `task_history` table migration
**File:** `app/Modules/Tasks/Database/Migrations/2026_04_13_000003_create_task_history_table.php`

| Column | Type | Notes |
|---|---|---|
| id | bigIncrements | PK |
| task_id | foreignId → tasks | cascadeOnDelete, indexed |
| event_type | string(50) | e.g. `task_created`, `task_updated`, `assignee_added` |
| old_value | json | nullable |
| new_value | json | nullable |
| actor_user_id | foreignId → users | |
| created_at | timestamp | |

**Why:** Epics.md defines this model. JSON columns for old/new values allow flexible tracking of any field change.

---

## Phase 2 — Models

### Step 2.1 — `Task` model
**File:** `app/Modules/Tasks/Model/Task.php`

- Uses `BelongsToWorkspace` trait + `SoftDeletes`
- `$fillable`: workspace_id, project_id, title, description, status, created_by_user_id
- Relations: `project()`, `creator()`, `assignments()`, `assignees()` (through assignments), `history()`
- Status constants: e.g. `STATUS_TODO = 'todo'`, `STATUS_IN_PROGRESS = 'in_progress'`, `STATUS_DONE = 'done'`, "use enums if needed" + "add more status"

**Why:** Follows `Project` model pattern. `BelongsToWorkspace` auto-scopes reads/writes to current workspace.

### Step 2.2 — `TaskAssignment` model
**File:** `app/Modules/Tasks/Model/TaskAssignment.php`

- `$fillable`: task_id, user_id, assigned_by_user_id
- `$timestamps = false` (only `created_at`)
- Relations: `task()`, `user()`, `assignedBy()`

**Why:** Represents the M-N relationship with extra pivot data (`assigned_by_user_id`).

### Step 2.3 — `TaskHistory` model
**File:** `app/Modules/Tasks/Model/TaskHistory.php`

- `$fillable`: task_id, event_type, old_value, new_value, actor_user_id
- `$timestamps = false` (only `created_at`)
- `$casts`: old_value → array, new_value → array
- Relations: `task()`, `actor()`

**Why:** JSON cast for old/new values makes it easy to read/write history diffs.

---

## Phase 3 — Service Layer

### Step 3.1 — `TaskService`
**File:** `app/Modules/Tasks/Services/TaskService.php`

Methods (mirrors `ProjectService` patterns):
- `currentWorkspace()` — get workspace from context
- `createTask(Workspace, array, User)` — validate project exists + same workspace, create task with status=todo, add assignees, record history
- `getTask(Workspace, int)` — resolve task by ID within workspace, eager-load assignees
- `listTasks(Workspace, array)` — pagination + filters (projectId, status, assigneeId) + sorting
- `updateTask(Task, array, User)` — guard not deleted, apply changes, track diffs in history
- `deleteTask(Task, User)` — soft delete, record history
- `resolveTask(Workspace, int)` / `resolveActiveTask(Workspace, int)` — find or throw

**Why:** Centralizes business logic. Follows same pattern as `ProjectService` (constructor-injected `WorkspaceContextService`, guard methods, DB transactions).

### Step 3.2 — `TaskAssignmentService`
**File:** `app/Modules/Tasks/Services/TaskAssignmentService.php`

Methods:
- `addAssignees(Task, array $userIds, User $actor)` — validate users belong to workspace, skip duplicates, record `assignee_added` history per user
- `removeAssignees(Task, array $userIds, User $actor)` — remove matching rows, record `assignee_removed` history per user
- `replaceAssignees(Task, array $userIds, User $actor)` — diff logic: `toAdd = new - existing`, `toRemove = existing - new`, record history for each change
- `getAssignees(Task)` — return users list

**Why:** Separates assignment logic from core task CRUD. The diff logic for replace is specified in epics.md (Feature 5.6).

### Step 3.3 — `TaskHistoryService`
**File:** `app/Modules/Tasks/Services/TaskHistoryService.php`

Methods:
- `record(Task, string $eventType, ?array $oldValue, ?array $newValue, User $actor)` — insert history row
- ability to Read

**Why:** Small helper to keep history recording DRY across TaskService and TaskAssignmentService.

---

## Phase 4 — HTTP Layer

### Step 4.1 — Form Requests

| File | Purpose |
|---|---|
| `Http/Requests/CreateTaskRequest.php` | Validate title (required, max:255), description (optional), projectId (required, exists), assigneeIds (optional, array of existing user IDs) |
| `Http/Requests/UpdateTaskRequest.php` | Validate title (optional, max:255), description (optional), status (optional, in:todo,in_progress,done) |
| `Http/Requests/ListTasksRequest.php` | Validate filters: projectId, status, assigneeId, page, per_page, sort_by, sort_dir |
| `Http/Requests/ManageAssigneesRequest.php` | Validate userIds (required, array of existing user IDs) |

**Why:** Follows existing `CreateProjectRequest` / `UpdateProjectRequest` pattern. Validation at the request layer keeps controllers thin.

### Step 4.2 — `TasksController`
**File:** `app/Modules/Tasks/Http/Controllers/TasksController.php`

Endpoints → Action classes:
- `create(CreateTaskRequest, CreateTask)` → 201
- `show(int $taskId, GetTask)` → 200
- `index(ListTasksRequest, ListTasks)` → 200
- `update(int $taskId, UpdateTaskRequest, UpdateTask)` → 200
- `delete(int $taskId, DeleteTask)` → 204

**Why:** Thin controller calling action classes, returning via `ApiResponse::success()`. Exact same pattern as `ProjectsController`.

### Step 4.3 — `TaskAssigneesController`
**File:** `app/Modules/Tasks/Http/Controllers/TaskAssigneesController.php`

Endpoints → Action classes:
- `add(int $taskId, ManageAssigneesRequest, AddAssignees)` → 200
- `remove(int $taskId, ManageAssigneesRequest, RemoveAssignees)` → 200
- `replace(int $taskId, ManageAssigneesRequest, ReplaceAssignees)` → 200
- `index(int $taskId, GetAssignees)` → 200

**Why:** Separate controller for assignee sub-resource keeps things clean. Maps directly to Feature 5.6 and 5.7.

### Step 4.4 — Action Classes
**Directory:** `app/Modules/Tasks/Actions/`

| File | Delegates to |
|---|---|
| `CreateTask.php` | `TaskService::createTask()` |
| `GetTask.php` | `TaskService::getTask()` |
| `ListTasks.php` | `TaskService::listTasks()` |
| `UpdateTask.php` | `TaskService::updateTask()` |
| `DeleteTask.php` | `TaskService::deleteTask()` |
| `AddAssignees.php` | `TaskAssignmentService::addAssignees()` |
| `RemoveAssignees.php` | `TaskAssignmentService::removeAssignees()` |
| `ReplaceAssignees.php` | `TaskAssignmentService::replaceAssignees()` |
| `GetAssignees.php` | `TaskAssignmentService::getAssignees()` |

**Why:** Single-responsibility action classes, same pattern as `CreateProject`, `DeleteProject`, etc.

### Step 4.5 — Routes
**File:** `app/Modules/Tasks/Http/routes.php`

```
POST   /tasks                      → hasPermission:task.create
GET    /tasks                      → hasPermission:task.view
GET    /tasks/{taskId}             → hasPermission:task.view
PUT    /tasks/{taskId}             → hasPermission:task.update
DELETE /tasks/{taskId}             → hasPermission:task.delete
POST   /tasks/{taskId}/assignees   → hasPermission:task.assign
DELETE /tasks/{taskId}/assignees   → hasPermission:task.assign
PUT    /tasks/{taskId}/assignees   → hasPermission:task.assign
GET    /tasks/{taskId}/assignees   → hasPermission:task.view
```

All wrapped in `middleware(['auth:api', 'workspace.context'])`.

**Why:** Matches epics.md API definitions. Permission keys already exist in `PermissionCatalogService::PERMISSION_MATRIX['task']`.

---

## Phase 5 — Exception Class

### Step 5.1 — `TasksException`
**File:** `app/Modules/Tasks/Exceptions/TasksException.php`

Static factory methods:
- `taskNotFound(int $taskId, int $workspaceId)`
- `taskAlreadyDeleted(int $taskId, int $workspaceId)`
- `taskDeletedImmutable(int $taskId, int $workspaceId)`
- `userNotInWorkspace(int $userId)`
- `assigneeAlreadyExists(int $userId, int $taskId)`

**Why:** Follows `ProjectsException` pattern. Domain-specific exceptions with meaningful error codes for `ApiResponse::error()`.

---

## Phase 6 — Service Provider

### Step 6.1 — `TasksServiceProvider`
**File:** `app/Modules/Tasks/TasksServiceProvider.php`

- `boot()`: load migrations from `Database/Migrations`, map API routes
- Register in `config/app.php` providers array

**Why:** Exact same pattern as `ProjectsServiceProvider`. Required for Laravel to discover the module's migrations and routes.

---

## Phase 7 — Comments Module

### Step 7.1 — Migration: `comments` table
**File:** `app/Modules/Comments/Database/Migrations/2026_04_13_000004_create_comments_table.php`

| Column | Type | Notes |
|---|---|---|
| id | bigIncrements | PK |
| workspace_id | foreignId → workspaces | indexed |
| task_id | foreignId → tasks | cascadeOnDelete, indexed |
| parent_id | foreignId → comments | nullable, for reply threading |
| user_id | foreignId → users | who wrote the comment |
| body | text | required |
| is_edited | boolean | default `false`, set to `true` on update |
| edited_at | timestamp | nullable, set on update |
| timestamps | | |
| softDeletes | | for moderation/delete |

**New columns explained:**
- **`is_edited`** — boolean flag so the UI can show "(edited)" next to updated comments
- **`edited_at`** — tracks when the last edit happened
- **`parent_id`** — self-referencing FK for threaded replies (nullable = top-level comment)

**Why:** Comments are a natural sub-resource of tasks. Permissions already exist in `PermissionCatalogService` (`comment.*`).

### Step 7.2 — Migration: `comment_mentions` table
**File:** `app/Modules/Comments/Database/Migrations/2026_04_13_000005_create_comment_mentions_table.php`

| Column | Type | Notes |
|---|---|---|
| id | bigIncrements | PK |
| comment_id | foreignId → comments | cascadeOnDelete |
| mentioned_user_id | foreignId → users | the user who was @mentioned |
| created_at | timestamp | |

**Unique constraint:** `(comment_id, mentioned_user_id)`

**Why:** When a user writes `@otherUser` in a comment body, the system parses the mentions and stores them here. This enables:
- Querying "show me all comments where I was mentioned"
- Future: triggering notifications for mentioned users (Phase 8)

### Step 7.3 — Models

**`Comment` model** — `app/Modules/Comments/Model/Comment.php`
- Uses `BelongsToWorkspace`, `SoftDeletes`
- `$fillable`: workspace_id, task_id, parent_id, user_id, body, is_edited, edited_at
- `$casts`: is_edited → boolean, edited_at → datetime
- Relations: `task()`, `user()`, `parent()`, `replies()` (hasMany self), `mentions()`, `mentionedUsers()`

**`CommentMention` model** — `app/Modules/Comments/Model/CommentMention.php`
- `$fillable`: comment_id, mentioned_user_id
- `$timestamps = false` (only created_at)
- Relations: `comment()`, `user()`

### Step 7.4 — `CommentService`
**File:** `app/Modules/Comments/Services/CommentService.php`

Methods:
- `createComment(Task, array $data, User)` — create comment, parse `@mentions` from body, insert into `comment_mentions`, optionally record `comment_added` in task_history
- `listComments(Task, array $filters)` — paginated list for a task, eager-load user + replies + mentions. Support filter by `parent_id` (null = top-level only)
- `getComment(Task, int $commentId)` — single comment with replies
- `updateComment(Comment, string $body, User)` — only author or moderator, set `is_edited = true` + `edited_at = now()`, re-parse mentions
- `deleteComment(Comment, User)` — soft delete, only author or moderator

**Mention parsing logic:**
- Regex extract `@username` patterns from body
- Resolve usernames to user IDs within the workspace
- Sync `comment_mentions` table (add new, remove stale on edit)
- Invalid/unknown `@mentions` are silently ignored

**Why:** Centralizes mention extraction so it works consistently on both create and update.

### Step 7.5 — HTTP layer

**Form Requests:**
- `CreateCommentRequest` — body (required), parentId (optional, exists in comments)
- `UpdateCommentRequest` — body (required)
- `ListCommentsRequest` — page, per_page, parent_id filter

**Controllers:**
- `CommentsController` — CRUD endpoints

**Action classes:** `CreateComment`, `GetComment`, `ListComments`, `UpdateComment`, `DeleteComment`

**Routes** under `/tasks/{taskId}/comments`:
```
POST   /tasks/{taskId}/comments              → hasPermission:comment.create
GET    /tasks/{taskId}/comments              → hasPermission:comment.view
GET    /tasks/{taskId}/comments/{commentId}  → hasPermission:comment.view
PATCH  /tasks/{taskId}/comments/{commentId}  → hasPermission:comment.update
DELETE /tasks/{taskId}/comments/{commentId}  → hasPermission:comment.delete
```

### Step 7.6 — `CommentsException` + `CommentsServiceProvider`
Same patterns as Tasks module.

### Additional Comment features summary
| Feature | How | Why |
|---|---|---|
| **Edit tracking** | `is_edited` bool + `edited_at` timestamp | UI shows "(edited)" badge, transparency |
| **@Mentions** | Parse body → `comment_mentions` table | Queryable, future notification hook |
| **Reply threading** | `parent_id` self-FK | Nested conversations without separate table |
| **Moderation** | `comment.moderate` permission + soft delete | Admins can remove inappropriate comments |

---

## Phase 8 — NOT IMPLEMENTED (keep for later)

- [ ] **Audit module** (`audit.view`, `audit.export`) — not yet implemented
- [ ] **Notifications** — not yet implemented
- [ ] **Reports module** (`report.view`, `report.create`, `report.export`) — not yet implemented (if applicable)

---

## File Summary

```
app/Modules/Tasks/
├── TasksServiceProvider.php
├── Actions/
│   ├── CreateTask.php
│   ├── GetTask.php
│   ├── ListTasks.php
│   ├── UpdateTask.php
│   ├── DeleteTask.php
│   ├── AddAssignees.php
│   ├── RemoveAssignees.php
│   ├── ReplaceAssignees.php
│   └── GetAssignees.php
├── Database/Migrations/
│   ├── 2026_04_13_000001_create_tasks_table.php
│   ├── 2026_04_13_000002_create_task_assignments_table.php
│   └── 2026_04_13_000003_create_task_history_table.php
├── Exceptions/
│   └── TasksException.php
├── Http/
│   ├── routes.php
│   ├── Controllers/
│   │   ├── TasksController.php
│   │   └── TaskAssigneesController.php
│   └── Requests/
│       ├── CreateTaskRequest.php
│       ├── UpdateTaskRequest.php
│       ├── ListTasksRequest.php
│       └── ManageAssigneesRequest.php
├── Model/
│   ├── Task.php
│   ├── TaskAssignment.php
│   └── TaskHistory.php
└── Services/
    ├── TaskService.php
    ├── TaskAssignmentService.php
    └── TaskHistoryService.php

app/Modules/Comments/
├── CommentsServiceProvider.php
├── Actions/
│   ├── CreateComment.php
│   ├── GetComment.php
│   ├── ListComments.php
│   ├── UpdateComment.php
│   └── DeleteComment.php
├── Database/Migrations/
│   ├── 2026_04_13_000004_create_comments_table.php
│   └── 2026_04_13_000005_create_comment_mentions_table.php
├── Exceptions/
│   └── CommentsException.php
├── Http/
│   ├── routes.php
│   ├── Controllers/
│   │   └── CommentsController.php
│   └── Requests/
│       ├── CreateCommentRequest.php
│       ├── UpdateCommentRequest.php
│       └── ListCommentsRequest.php
├── Model/
│   ├── Comment.php
│   └── CommentMention.php
└── Services/
    └── CommentService.php
```

**Also update:** `config/app.php` → add `TasksServiceProvider` and `CommentsServiceProvider` to providers array.
