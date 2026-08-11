# EPIC 19 â Imports and Bulk Operations

## Epic Scope
Bulk create/update task operations and optional CSV imports.

**Explanation:** Bulk operations save time but are dangerous. They must validate every row, handle partial failures predictably, and avoid bypassing authorization.

## Feature 19.1 â Bulk Task Update

### Services / Actions Used
- **Action:** `BulkUpdateTasks`
- **Service:** `BulkTaskService`

### Domain Rules
- Every task must belong to workspace.
- User must be authorized for every changed task.
- Bulk operation must return success/failure summary.

### Tasks
- **API**
  - `PATCH /tasks/bulk`
- **Supported Updates**
  - status through workflow rules
  - assignees
  - due date
  - priority
- **Tests**
  - bulk update works
  - unauthorized task fails
  - cross-workspace task denied

## Feature 19.2 â Task CSV Import

### Services / Actions Used
- **Action:** `ImportTasks`
- **Job:** `ProcessTaskImport`
- **Service:** `ImportService`

### Domain Rules
- Validate file.
- Validate each row.
- Store import result.
- Do not create invalid tasks.

### Tasks
- **DB**
  - `imports`:
    - id
    - workspace_id
    - requested_by_user_id
    - type
    - status
    - total_rows
    - successful_rows
    - failed_rows
    - error_report_path nullable
    - timestamps
- **API**
  - `POST /imports/tasks`
  - `GET /imports/{id}`
- **Tests**
  - valid import creates tasks
  - invalid rows reported

---
