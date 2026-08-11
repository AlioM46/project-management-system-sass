# EPIC 5 â Tasks

## Epic Scope
Manage tasks, multiple assignees, validation, and history tracking.

**Explanation:** Task writes are direct changes to task data: title, description, assignees, due date, status, deletion. They are not comments or chat.

## Feature 5.1 â Create Task

### User Story
As a member, I want to create a task inside a project so work can be tracked.

### Services / Actions Used
- **Action:** `CreateTask`
- **Service:** `TaskService`
- **Service:** `AuthorizationService`
- **Service:** `TaskHistoryService`
- **Service:** `NotificationService`

### Domain Rules
- Title required.
- Project must exist in same workspace.
- Assignees must belong to workspace.
- Task starts in default status, usually `TODO`.
- Assignment may produce notifications.

### Tasks
- **DB**
  - `tasks`:
    - id
    - workspace_id
    - project_id
    - title
    - description
    - status
    - priority nullable
    - due_at nullable
    - created_by_user_id
    - timestamps
    - soft deletes
  - `task_assignments`:
    - id
    - task_id
    - user_id
    - assigned_by_user_id
    - timestamps
    - unique(task_id, user_id)
  - `task_history`:
    - id
    - workspace_id
    - task_id
    - event_type
    - old_value JSON
    - new_value JSON
    - actor_user_id
    - created_at
- **API**
  - `POST /tasks`
- **Flow**
  1. Validate input.
  2. Check `task.create`.
  3. Ensure project belongs to workspace.
  4. Ensure assignees belong to workspace.
  5. Create task.
  6. Add assignees.
  7. Save history.
  8. Send notifications if needed.
- **Tests**
  - task created
  - invalid project denied
  - cross-workspace assignee denied
  - history saved

## Feature 5.2 â Get Task

### User Story
As a member, I want to view a task with its assignees.

### Services / Actions Used
- **Action:** `GetTask`
- **Service:** `TaskQueryService`

### Domain Rules
- Task must belong to current workspace.
- Response includes assignees.

### Tasks
- **API**
  - `GET /tasks/{id}`
- **Tests**
  - workspace task visible
  - cross-workspace task denied

## Feature 5.3 â List Tasks

### User Story
As a member, I want to list tasks with filtering and sorting.

### Services / Actions Used
- **Action:** `ListTasks`
- **Service:** `TaskQueryService`

### Domain Rules
- Workspace-scoped.
- Paginated.
- Filterable.
- Sortable.

### Tasks
- **API**
  - `GET /tasks`
- **Filters**
  - project_id
  - status
  - assignee_id
  - due_at
  - created_by_user_id
- **Sorting**
  - created_at
  - due_at
  - status
- **Tests**
  - filters work
  - pagination works
  - sorting works

## Feature 5.4 â Update Task

### User Story
As a member, I want to update task details.

### Services / Actions Used
- **Action:** `UpdateTask`
- **Service:** `TaskService`
- **Service:** `TaskHistoryService`

### Domain Rules
- Only changed fields are tracked.
- Cannot update deleted task.
- Status changes should go through Workflow Engine, not generic update.

### Tasks
- **API**
  - `PUT /tasks/{id}`
  - `PATCH /tasks/{id}`
- **Tests**
  - update works
  - deleted task cannot be updated
  - changed fields tracked

## Feature 5.5 â Delete Task

### User Story
As a member, I want to delete a task when it is no longer needed.

### Services / Actions Used
- **Action:** `DeleteTask`
- **Service:** `TaskService`
- **Service:** `TaskHistoryService`

### Domain Rules
- `task.delete` required.
- Soft delete only.
- Delete action creates history and audit.

### Tasks
- **API**
  - `DELETE /tasks/{id}`
- **Tests**
  - soft delete works
  - history saved
  - audit log saved

## Feature 5.6 â Manage Assignees

### User Story
As a manager, I want to add, remove, or replace task assignees.

### Services / Actions Used
- **Action:** `AddTaskAssignees`
- **Action:** `RemoveTaskAssignees`
- **Action:** `ReplaceTaskAssignees`
- **Service:** `TaskAssignmentService`
- **Service:** `TaskHistoryService`
- **Service:** `NotificationService`

### Domain Rules
- `task.assign` required.
- Users must belong to workspace.
- No duplicates.
- Assignment creates history.
- Assignment may notify assigned user.

### Tasks
- **API**
  - `POST /tasks/{id}/assignees`
  - `DELETE /tasks/{id}/assignees`
  - `PUT /tasks/{id}/assignees`
  - `GET /tasks/{id}/assignees`
- **Core Logic**
  - `toAdd = newUsers - existingUsers`
  - `toRemove = existingUsers - newUsers`
- **Tests**
  - add assignee
  - remove assignee
  - replace assignees
  - duplicate blocked
  - cross-workspace user blocked

---
