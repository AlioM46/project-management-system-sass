# EPIC 6 â Workflow Engine

## Epic Scope
Control task status changes using rules, validation, concurrency protection, and history.

**Explanation:** Status change is not just a task update. It is workflow behavior. Keep it in the Workflow module so transition rules stay centralized.

## Feature 6.1 â Change Status

### User Story
As an assignee, I want to move a task through allowed statuses.

### Services / Actions Used
- **Action:** `ChangeTaskStatus`
- **Service:** `WorkflowService`
- **Service:** `TaskHistoryService`
- **Service:** `AuthorizationService`

### Domain Rules
- `task.update_status` required.
- Only allowed transitions are accepted.
- Only assignees can change status if that is your business rule.
- Status update + history must be atomic.

### Tasks
- **API**
  - `PATCH /tasks/{id}/status`
- **Request**
  - `status`
- **Flow**
  1. Get task.
  2. Check permission.
  3. Check actor is assignee if required.
  4. Validate transition.
  5. Update status.
  6. Save history.
  7. Audit event.
  8. Optional notification.
- **Tests**
  - valid transition works
  - invalid transition fails
  - non-assignee denied
  - history saved

## Feature 6.2 â Status Enum

### Domain Rules
Supported statuses:
- `TODO`
- `IN_PROGRESS`
- `BLOCKED`
- `DONE`
- `CANCELLED`

### Tasks
- Use PHP enum if available.
- Validate input against enum.
- Avoid magic strings across codebase.

## Feature 6.3 â Transition Rules

### Domain Rules
Default transitions:
- `TODO` => `IN_PROGRESS`, `CANCELLED`
- `IN_PROGRESS` => `DONE`, `BLOCKED`
- `BLOCKED` => `IN_PROGRESS`
- `DONE` => none
- `CANCELLED` => none

### Tasks
- Implement transition dictionary.
- Throw `InvalidTransitionException` on invalid transition.
- Add tests for every allowed and forbidden transition.

## Feature 6.4 â Task History for Status Changes

### Domain Rules
- Old status and new status must be stored.
- Actor must be stored.
- History must be workspace-scoped.

### Tasks
- Event type: `status_changed`.
- Store old/new JSON.
- Sort history latest first.

## Feature 6.5 â Get Task History

### API
- `GET /tasks/{id}/history`

### Domain Rules
- Paginated.
- Filterable by event type.
- Sorted latest first.

### Tests
- workspace-scoped history only
- filter works
- pagination works

## Feature 6.6 â Concurrency Control

### Domain Rules
- Two users should not overwrite status changes unpredictably.

### Laravel/MySQL Options
- Use `lockForUpdate()` inside transaction.
- Or use optimistic locking with a version column.
- Or compare `updated_at` with client-provided value.

### Tests
- concurrent update is handled safely
- history does not lie about final state

---
